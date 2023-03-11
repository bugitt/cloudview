import { NextApiRequest, NextApiResponse } from "next";
import { Workflow } from "../../../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";
import { workflowClient } from "../../../../lib/kube/cloudrun";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Workflow[]>) {
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
    let workflowList: Workflow[] = []
    switch (req.method) {
        case 'GET':
            workflowList = await workflowClient.list(undefined, selector)
            break
        case 'DELETE':
            workflowList = await workflowClient.deleteMany(undefined, selector)
            break
    }
    res.status(200).json(workflowList)
}