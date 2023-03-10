import { NextApiRequest, NextApiResponse } from "next";
import { deployerClient, workflowClient } from "../../../../lib/kube/cloudrun";
import { getWorkflowName, getWorkflowNamespace, WorkflowResponse } from "../../../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";
import { getServiceStatus } from "../../deployer/[name]/serviceStatus";
import { getWorkflowDisplayStatus } from "../../workflow/[name]/displayStatus";

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
    const responseList = await Promise.all(workflows.map(async (workflow) => {
        const displayStatus = await getWorkflowDisplayStatus(workflow)
        let deployer = await deployerClient.get(getWorkflowName(workflow)!!, getWorkflowNamespace(workflow)!!)
        if (deployer && deployer.status?.base?.currentRound !== (workflow.status?.base?.currentRound || 0)) {
            deployer = undefined
        }
        const serviceStatus = deployer ? await getServiceStatus(deployer) : undefined
        return {
            workflow: workflow,
            displayStatus: displayStatus,
            serviceStatus: serviceStatus,
        }
    }))
    res.status(200).json(responseList)
}