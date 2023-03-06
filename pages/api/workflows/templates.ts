
import { NextApiRequest, NextApiResponse } from "next"
import { workflowTemplates } from "../../../lib/components/workflow/workflowTemplates";
import { WorkflowTemplate } from "../../../lib/models/workflow"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<WorkflowTemplate[]>
) {
    const { method } = req;
    switch (method) {
        case 'GET':
            res.status(200).json(workflowTemplates)
            break

        default:
            res.setHeader('Allow', ['GET'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}