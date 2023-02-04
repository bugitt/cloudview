import { NextApiRequest, NextApiResponse } from "next";
import { workflowClient } from "../../../lib/kube/cloudrun";
import { Workflow } from "../../../lib/models/workflow";
import { whoami } from "../../../lib/utils/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Workflow>) {
    const {
        query: { name },
        method,
    } = req;

    const user = await whoami(req)
    let projectName = ''
    if (req.method === 'PATCH') {
        projectName = req.body.projectName as string
    } else if (req.method === 'GET') {
        projectName = req.query.projectName as string
    }
    if (!user || !projectName) {
        res.status(401).end('Unauthorized')
        return
    }

    if (user.projects?.indexOf(projectName) === -1) {
        res.status(403).end('Forbidden')
        return
    }

    switch (method) {
        case 'GET':
            const workflow = await workflowClient.get(name as string, projectName)
            res.status(200).json(workflow)
            break
        case 'PATCH':


        default:
            res.setHeader('Allow', ['GET', 'PATCH'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}