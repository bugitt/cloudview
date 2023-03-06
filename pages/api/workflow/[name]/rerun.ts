import { NextApiRequest, NextApiResponse } from "next";
import { workflowClient } from "../../../../lib/kube/cloudrun";
import { Workflow } from "../../../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Workflow>) {
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

    const workflow = await workflowClient.get(name as string, projectName as string)
    workflow.spec.round = (workflow.status?.base?.currentRound || 0) + 1
    const newWorkflow = await workflowClient.createOrUpdate(workflow)
    res.status(200).json(newWorkflow)
}
