import { NextApiRequest, NextApiResponse } from "next";
import { deployerClient } from "../../../../lib/kube/cloudrun";
import { Deployer } from "../../../../lib/models/deployer";
import { whoami } from "../../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Deployer>) {
    const {
        query: { name, projectName, resourcePool, imageName },
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
    if (!deployer) {
        res.status(404).end('Not Found')
        return
    }
    if (resourcePool) {
        deployer.spec.resourcePool = resourcePool as string
    }
    if (imageName) {
        deployer.spec.containers[0].image = imageName as string
    }
    deployer.spec.round = (deployer.status?.base?.currentRound || 0) + 1
    const newDeployer = await deployerClient.createOrUpdate(deployer)
    res.status(200).json(newDeployer)
}