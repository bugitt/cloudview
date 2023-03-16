import { NextApiRequest, NextApiResponse } from "next";
import { deployerConfig } from "../../../../lib/config/env";
import { deployerClient } from "../../../../lib/kube/cloudrun";
import { listPods, listServices } from "../../../../lib/kube/core";
import { Deployer, ServicePort, ServiceStatus } from "../../../../lib/models/deployer";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ServiceStatus>) {
    const {
        query: { name, projectName },
    } = req;

    const client = serverSideCloudapiClient(undefined, req)
    const project = (await client.getProjects(undefined, projectName as string)).data[0]
    const permissionOk = (await client.getCheckPermission('project', String(project.id), 'read')).data
    if (!permissionOk) {
        res.status(403).end('Forbidden')
        return
    }

    const deployer = await deployerClient.get(name as string, projectName as string)
    if (!deployer) {
        res.status(404).end('Not Found')
        return
    }
    const status = await getServiceStatus(deployer)
    res.status(200).json(status)
}

export async function getServiceStatus(deployer: Deployer) {
    const selector = `owner.name=${deployer.metadata?.name},round=${deployer.status?.base?.currentRound}`
    const pods = await listPods(deployer.metadata?.namespace!!, selector)
    let healthy = false
    pods.forEach(p => {
        if (deployer.metadata?.name === 'wf-nuxz1p6lzh6vi2d5bloj')
            console.log('lolheagnkkkkk', p.metadata, p.status?.phase, p.status?.containerStatuses?.[0]?.ready)
        if (p.status?.phase === 'Running' && p.status?.containerStatuses?.[0]?.ready) {
            healthy = (healthy || true)
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
    return { healthy, ports }
}
