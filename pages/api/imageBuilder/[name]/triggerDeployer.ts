import { NextApiRequest, NextApiResponse } from "next";
import { imageBuilderClient } from "../../../../lib/kube/cloudrun";
import { Builder } from "../../../../lib/models/builder";
import { whoami } from "../../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Builder>) {
    const {
        query: { name, projectName, resourcePool, image, deployerName },
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

    const builder = await imageBuilderClient.get(name as string, projectName as string)
    const hook = {
        deployerName: deployerName as string,
        image: image as string,
        resourcePool: resourcePool as string,
    }
    builder.spec.deployerHooks = [hook]
    const newBuilder = await imageBuilderClient.createOrUpdate(builder)
    res.status(200).json(newBuilder)
}
