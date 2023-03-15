import { NextApiRequest, NextApiResponse } from "next";
import { workflowClient } from "../../../../lib/kube/cloudrun";
import { WorkflowResponse } from "../../../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";
import { convertWorkflowResponseList } from "../../workflowResponses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<WorkflowResponse[]>) {
    const client = serverSideCloudapiClient(undefined, req)
    const expId = req.query.id as unknown as string
    const permissionOk = (await client.getCheckPermission('experiment', expId, 'write')).data
    if (!permissionOk) {
        res.status(403).end('Forbidden')
        return
    }
    const tag = req.query.tag as string
    const studentIdListStr = req.query.studentIdList

    const studentIdList = studentIdListStr ? (studentIdListStr as unknown as string).split(',').map(it => it.trim().toLowerCase()) : undefined
    const selector: { [k: string]: string | string[] } = {
        expId: expId,
    }
    if (tag) {
        selector.tag = tag
    }
    if (studentIdList) {
        selector.owner = studentIdList
    }
    const workflows = await workflowClient.list(undefined, selector)
    res.status(200).json(await convertWorkflowResponseList(workflows))
}