import { NextApiRequest, NextApiResponse } from "next";
import { imageBuilderClient } from "../../../../lib/kube/cloudrun";
import { Builder } from "../../../../lib/models/builder";
import { AddDeployerTriggerRequest } from "../../../../lib/models/deployer";
import { whoami } from "../../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Builder>) {
    const {
        query: { name },
    } = req;
    const request = req.body as AddDeployerTriggerRequest

    const user = await whoami(req)
    const projectName = request.projectName

    if (!user || !projectName) {
        res.status(401).end('Unauthorized')
        return
    }
    if (user.projects?.indexOf(projectName as string) === -1) {
        res.status(403).end('Forbidden')
        return
    }

    const builder = await imageBuilderClient.get(name as string, projectName)
    const hook = {
        deployerName: request.deployerName,
        image: request.image,
        dynamicImage: request.dynamicImage,
        resourcePool: request.resourcePool,
    }
    builder.spec.deployerHooks = [hook]
    const newBuilder = await imageBuilderClient.createOrUpdate(builder)
    res.status(200).json(newBuilder)
}
