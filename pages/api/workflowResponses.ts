import { NextApiRequest, NextApiResponse } from "next";
import { whoami } from "../../lib/utils/server";
import { deployerClient, workflowClient } from "../../lib/kube/cloudrun";
import { getWorkflowName, getWorkflowNamespace, Workflow, WorkflowResponse } from "../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../lib/utils/cloudapi";
import { getServiceStatus } from "./deployer/[name]/serviceStatus";
import { getWorkflowDisplayStatus } from "./workflow/[name]/displayStatus";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<WorkflowResponse[]>
) {
    const client = serverSideCloudapiClient(undefined, req)
    const user = await whoami(req, client)
    if (!user) {
        res.status(401).end('Unauthorized')
        return
    }

    const { method } = req;
    switch (method) {
        case 'GET':
            const projectName = req.query.projectName as string
            const project = (await client.getProjects(undefined, projectName)).data[0]
            const permissionOk = (await client.getCheckPermission('project', String(project.id), 'read')).data
            if (!permissionOk) {
                res.status(403).end('Forbidden')
                return
            }
            let selector: { [k: string]: string; } | undefined = undefined
            const tag = req.query.tag as string
            if (tag) {
                selector = {
                    'tag': tag,
                }
            }
            const workflows = await (workflowClient.list(projectName, selector))
            res.status(200).json(await convertWorkflowResponseList(workflows))
            break

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}

export async function convertWorkflowResponseList(workflows: Workflow[]) {
    return Promise.all(workflows.map(async (workflow) => {
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
}
