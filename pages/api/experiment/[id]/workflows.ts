import { NextApiRequest, NextApiResponse } from "next";
import { Workflow } from "../../../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";
import { workflowClient } from "../../../../lib/kube/cloudrun";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Workflow[]>) {
    const client = serverSideCloudapiClient(undefined, req)
    const expId = req.query.id as unknown as number
    const permissionOk = (await client.getCheckPermission('experiment', String(expId), 'write')).data
    if (!permissionOk) {
        res.status(403).end('Forbidden')
        return
    }
    const tag = req.query.tag as string

    const workflowList = await client.getProjects(expId).then((data) => {
        const projects = data.data
        return Promise.all(projects.map(async (project) => {
            return await workflowClient.list(project.name, tag ? { 'tag': tag } : undefined)
        }))
    }).then(data => data.flat())
    res.status(200).json(workflowList)
}