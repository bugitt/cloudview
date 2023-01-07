import { NextApiRequest, NextApiResponse } from "next";
import { deployerConfig } from "../../../../lib/config/env";
import { deployerClient } from "../../../../lib/kube/cloudrun";
import { listPods, listServices } from "../../../../lib/kube/core";
import { ServicePort, ServiceStatus } from "../../../../lib/models/deployer";
import { whoami } from "../../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ServiceStatus>) {
    const {
        query: { name, projectName },
    } = req;

    const user = await whoami(req)

    if (!user || !projectName) {
        res.status(401).end('Unauthorized')
        return
    }

    if (user.projects?.indexOf(projectName as string) === -1) {
        res.status(403).end('Forbidden')
        return
    }

    const deployer = await deployerClient.get(name as string, projectName as string)
    const selector = `app=${deployer.metadata?.name},round=${deployer.status?.base?.currentRound}`
    const pods = await listPods(deployer.metadata?.namespace!!, selector)
    let healthy = false
    pods.forEach(p => {
        if (p.status?.phase === 'Running' && p.status?.containerStatuses?.[0]?.ready) {
            healthy = true
        }
    })
    const ports: ServicePort[] = []
    const services = await listServices(deployer.metadata?.namespace!!, selector)
    const service = services[0]
    service.spec?.ports?.forEach(p => {
        const port: ServicePort = {
            name: p.name!!,
            port: p.targetPort as number,
            nodePort: p.nodePort!!,
            ip: deployerConfig.externalIp!!,
            protocol: p.protocol!!
        }
        ports.push(port)
    })
    res.status(200).json({ healthy, ports })
}
