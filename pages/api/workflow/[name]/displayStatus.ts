import { NextApiRequest, NextApiResponse } from "next";
import { deployerClient, imageBuilderClient, workflowClient } from "../../../../lib/kube/cloudrun";
import { getWorkflowName, getWorkflowNamespace, Workflow, WorkflowDisplayStatus } from "../../../../lib/models/workflow";
import { serverSideCloudapiClient } from "../../../../lib/utils/cloudapi";

export async function getWorkflowDisplayStatus(workflow: Workflow) {
    const ns = getWorkflowNamespace(workflow)!!
    const name = getWorkflowName(workflow)!!
    const currentRound = workflow.status?.base?.currentRound || 0
    let builder = await imageBuilderClient.get(name, ns)
    if (builder && builder.status?.base?.currentRound !== currentRound) {
        builder = undefined
    }
    let deployer = (await deployerClient.list(ns)).find(d => d.metadata?.name === name)
    if (deployer && deployer.status?.base?.currentRound !== currentRound) {
        deployer = undefined
    }
    const status: WorkflowDisplayStatus = {
        display: '未知状态',
        stage: 'Unknown',
        status: 'Process',
        builder: builder,
        deployer: deployer,
    }
    if (
        workflow.status?.base?.currentRound === 0
        || !builder
    ) {
        status.display = '未调度'
        status.stage = 'Pending'
        status.status = 'Process'
    }
    if (builder) {
        status.stage = 'Building'
        status.status = 'Process'
        switch (builder.status?.base?.status) {
            case 'UNDO':
                status.display = '准备构建镜像'
                break
            case 'Pending':
                status.display = '准备构建镜像'
                break
            case 'Doing':
                status.display = '正在构建镜像'
                break
            case 'Done':
                status.display = '镜像构建完成'
                status.status = 'Success'
                break
            case 'Failed':
                status.display = '镜像构建失败'
                status.status = 'Error'
                break
        }
    }
    if (deployer) {
        const type = deployer.spec?.type
        status.status = 'Process'
        switch (deployer.status?.base?.status) {
            case 'UNDO':
                status.display = type === 'service' ? '准备部署' : '准备执行'
                if (type === 'service') {
                    status.stage = 'Deploying'
                } else {
                    status.stage = 'Doing'
                }
                break
            case 'Pending':
                status.display = type === 'service' ? '部署中' : '准备执行'
                if (type === 'service') {
                    status.stage = 'Deploying'
                } else {
                    status.stage = 'Doing'
                }
                break
            case 'Doing':
                status.display = type === 'service' ? '部署完成' : '执行中'
                if (type === 'service') {
                    status.status = 'Success'
                    status.stage = 'Serving'
                } else {
                    status.stage = 'Doing'
                }
                break
            case 'Done':
                status.display = '执行完成'
                status.status = 'Success'
                if (type === 'service') {
                    status.stage = 'Serving'
                } else {
                    status.stage = 'Done'
                }
                break
            case 'Failed':
                status.display = type === 'service' ? '部署失败' : '执行失败'
                status.status = 'Error'
                break
        }
    }
    return status
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<WorkflowDisplayStatus>) {
    const name = req.query.name as string
    const projectName = req.query.projectName as string
    const client = serverSideCloudapiClient(undefined, req)
    const project = (await client.getProjects(undefined, projectName)).data[0]
    const permissionOk = (await client.getCheckPermission('project', String(project.id), 'read')).data
    if (!permissionOk) {
        res.status(403).end('Forbidden')
        return
    }

    const workflow = await workflowClient.get(name, projectName)
    workflow ? res.status(200).json(await getWorkflowDisplayStatus(workflow)) : res.status(404).end('Not Found')
}
