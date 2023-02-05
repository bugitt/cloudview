import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, FileZipOutlined, RedoOutlined, ReloadOutlined } from "@ant-design/icons";
import { ProDescriptions } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, Popconfirm, Space, Spin } from "antd";
import React, { useState } from "react";
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse, Project } from "../../cloudapi-client";
import { ExperimentWorkflowConfiguration, Workflow, WorkflowDisplayStatus } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi";
import { notificationError } from "../../utils/notification";
import { SubmitExperimentWorkflowForm } from "./SubmitExperimentWorkflowForm";

interface Props {
    experiment: ExperimentResponse
    wfConfResp: ExperimentWorkflowConfigurationResponse
    project: Project
}

export const workflowStageEnumObj = {
    'Pending': {
        text: '待执行/排队中',
        status: 'Processing'
    },
    'Building': {
        text: '构建中',
        status: 'Processing'
    },
    'Deploying': {
        text: '部署中',
        status: 'Processing'
    },
    'Serving': {
        text: '运行中',
        status: 'Success'
    },
    'Unknown': {
        text: '未知',
        status: 'Error'
    },
}

function getWorkflowDisplayStatusIcon(status?: WorkflowDisplayStatus): React.ReactNode {
    if (!status) return <></>
    switch (status.display) {
        case '部署完成':
        case '执行完成':
            return <CheckCircleFilled style={{
                color: 'green',
            }} />

        case '部署失败':
        case '执行失败':
            return <CloseCircleFilled style={{
                color: 'red',
            }} />

        default:
            return <ClockCircleFilled style={{
                color: 'geekblue',
            }} />
    }
}
export function WorkflowDescription(props: Props) {
    const { experiment, wfConfResp, project } = props
    const [workflow, setWorkflow] = useState<Workflow>()
    const [workflowDisplayStatus, setWorkflowDisplayStatus] = useState<WorkflowDisplayStatus>()
    const workflowDisplayStatusReq = useRequest((workflow?: Workflow) => {
        return workflow ? viewApiClient.getWorkflowDisplayStatus(workflow.metadata?.name!!, project.name) : Promise.resolve(undefined)
    }, {
        manual: true,
        onSuccess: (data) => {
            setWorkflowDisplayStatus(data)
        },
        onError: (_) => {
            notificationError('获取工作流状态失败')
        }
    })
    const workflowReq = useRequest(() => {
        return viewApiClient.listWorkflows(project.name, 'submit').then(wfList => {
            if (wfList.length === 0) {
                return undefined
            } else {
                return wfList[0]
            }
        })
    }, {
        onSuccess: (workflow) => {
            setWorkflow(workflow)
            workflowDisplayStatusReq.run(workflow)
        },
        onError: (_) => {
            notificationError('获取工作流失败')
        }
    })
    const gitContext = workflow?.spec.build?.context.git
    const httpContext = workflow?.spec.build?.context.http
    const formatUrl = (url: string) => {
        const urlObj = new URL(url)
        if (urlObj.password) {
            urlObj.password = '***'
        }
        urlObj.searchParams.delete('token')
        return urlObj.href
    }
    return (
        <Spin spinning={workflowReq.loading}>
            <ProDescriptions column={3} title="当前工作流详情">
                <ProDescriptions.Item valueType="option">
                    <Button
                        onClick={() => {
                            workflowReq.run()
                        }}
                    >
                        <ReloadOutlined />
                    </Button>
                    <Popconfirm
                        title="重新运行"
                        description="确定要重新运行当前任务吗？"
                        onConfirm={async () => {
                            const wfName = workflow?.metadata?.name
                            if (wfName) {
                                try {
                                    viewApiClient.rerunWorkflow(wfName, project.name)
                                } catch (_) {
                                    notificationError('重新运行当前任务失败')
                                }
                            }
                        }}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button>
                            <RedoOutlined /> 重新运行当前任务
                        </Button>
                    </Popconfirm>
                    <SubmitExperimentWorkflowForm
                        experiment={experiment}
                        resourcePool={wfConfResp.resourcePool}
                        wfConfig={JSON.parse(wfConfResp.configuration) as ExperimentWorkflowConfiguration}
                        oldWorkflow={workflow}
                        key="submit"
                    />
                </ProDescriptions.Item>
                <ProDescriptions.Item
                    label="状态"
                    valueType='text'
                >
                    {(<>
                        <Space>
                            {getWorkflowDisplayStatusIcon(workflowDisplayStatus)}
                            <span>{workflowDisplayStatus?.display}</span>
                        </Space>
                    </>)}
                </ProDescriptions.Item>
                <ProDescriptions.Item
                    valueType="text"
                    label="基础环境"
                    copyable
                >
                    {workflow?.spec.build?.baseImage}
                </ProDescriptions.Item>
                {gitContext && <ProDescriptions.Item label="Git仓库地址" valueType='text'>
                    <a href={gitContext.urlWithAuth} target='_blank' rel='noreferrer'>{formatUrl(gitContext.urlWithAuth)}</a>
                </ProDescriptions.Item>}
                {gitContext?.ref && <ProDescriptions.Item label="Git分支/commit/tag" valueType='text' copyable>
                    {gitContext.ref}
                </ProDescriptions.Item>}
                {httpContext && <ProDescriptions.Item label="源文件压缩包" valueType='text'>
                    <a href={httpContext.url} target='_blank' rel='noreferrer'><FileZipOutlined /></a>
                </ProDescriptions.Item>}
                <ProDescriptions.Item label="CPU限额" valueType='text'>
                    {workflow?.spec.deploy.resource.cpu} mCore
                </ProDescriptions.Item>
                <ProDescriptions.Item label="内存限额" valueType='text'>
                    {workflow?.spec.deploy.resource.memory} MB
                </ProDescriptions.Item>
                <ProDescriptions.Item label="编译命令" valueType="code">
                    {workflow?.spec.build?.command}
                </ProDescriptions.Item>
                <ProDescriptions.Item label="部署命令" valueType="code">
                    {workflow?.spec.deploy?.command}
                </ProDescriptions.Item>
                <ProDescriptions.Item label="端口号配置">
                    {
                        workflow?.spec.deploy?.ports?.map((port, index) => {
                            return (
                                <ProDescriptions key={index}>
                                    <ProDescriptions.Item label="端口号" valueType='text'>
                                        {port.port}
                                    </ProDescriptions.Item>
                                    <ProDescriptions.Item label="协议" valueType='text'>
                                        {port.protocol}
                                    </ProDescriptions.Item>
                                </ProDescriptions>
                            )
                        })
                    }
                </ProDescriptions.Item>
            </ProDescriptions >
        </Spin >
    );
}