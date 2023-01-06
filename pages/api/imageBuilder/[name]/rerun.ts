import { NextApiRequest, NextApiResponse } from "next";
import { imageBuilder } from "../../../../lib/config/env";
import { imageBuilderClient } from "../../../../lib/kube/cloudrun";
import { Builder, getImageMeta } from "../../../../lib/models/builder";
import { whoami } from "../../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Builder>) {
    const {
        query: { name, projectName, tag },
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
    if (tag) {
        const imageMeta = getImageMeta(builder)
        const newDest = `${imageBuilder.imageRegistry}/${projectName}/${imageMeta.name}:${tag}`
        builder.spec.destination = newDest
        const labels = builder.metadata!!.labels!!
        labels['image.tag'] = tag as string
        builder.metadata!!.labels = labels

        console.log(tag)
        console.log("loheagn builder", builder)
    }
    builder.spec.round = (builder.status?.base?.currentRound || 0) + 1
    const newBuilder = await imageBuilderClient.createOrUpdate(builder)
    res.status(200).json(newBuilder)
}
