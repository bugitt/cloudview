import { NextApiRequest, NextApiResponse } from "next";
import { deployerConfig } from "../../../../lib/config/env";
import { deployerClient } from "../../../../lib/kube/cloudrun";
import { listPods, listServices } from "../../../../lib/kube/core";
import { ServicePort, ServiceStatus } from "../../../../lib/models/deployer";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ServiceStatus>) {
    const {
        query: { name, projectName },
    } = req;

    const client = serverSideCloudapiClient(undefined, req)
    const project = (await client.getProjects(undefined, projectName as string)).data[0]
    const permissionOk = (await client.getCheckPermission('project', project.id, 'read')).data
    if (!permissionOk) {
        res.status(403).end('Forbidden')
        return
    }

    const deployer = await deployerClient.get(name as string, projectName as string)
    const selector = `owner.name=${deployer.metadata?.name},round=${deployer.status?.base?.currentRound}`
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
    service?.spec?.ports?.forEach(p => {
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
