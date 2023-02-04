import { NextApiRequest, NextApiResponse } from "next";
import { workflowClient } from "../../../../lib/kube/cloudrun";
import { Workflow } from "../../../../lib/models/workflow";
import { whoami } from "../../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Workflow>) {
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

    const workflow = await workflowClient.get(name as string, projectName as string)
    workflow.spec.round = (workflow.status?.base?.currentRound || 0) + 1
    const newWorkflow = await workflowClient.createOrUpdate(workflow)
    res.status(200).json(newWorkflow)
}
