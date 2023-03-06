import { FileZipOutlined, RedoOutlined, ReloadOutlined } from "@ant-design/icons";
import { ProDescriptions } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, Collapse, Popconfirm, Space, Spin, Typography } from "antd";
import Card from "antd/es/card/Card";
import React, { useState } from "react";
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from "../../cloudapi-client";
import { ServiceStatus } from "../../models/deployer";
import { ExperimentWorkflowConfiguration, getWfConfigRespTag, Workflow } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi";
import { notificationError } from "../../utils/notification";
import { WorkflowDisplayStatusComponent } from "../workflow/WorkflowDisplayStatusComponent";
import { useWorkflowStore } from "../workflow/workflowStateManagement";
import { WorkflowStep } from "../workflow/WorkflowStep";
import { SubmitExperimentWorkflowForm } from "./SubmitExperimentWorkflowForm";

interface Props {
    experiment: ExperimentResponse
    wfConfResp: ExperimentWorkflowConfigurationResponse
    projectName: string
    workflowName?: string
}

export function WorkflowDescription(props: Props) {
    const { experiment, wfConfResp, projectName, workflowName } = props
    const workflow = useWorkflowStore.getState().getWorkflow(workflowName, projectName)

    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>()
    const serviceStatusReq = useRequest((workflow?: Workflow) => {
        return workflow && workflow.spec.deploy.type === 'service' ? viewApiClient.getServiceStatus(workflow.metadata?.name!!, workflow.metadata?.namespace!!) : Promise.resolve(undefined)
    }, {
        manual: true,
        onSuccess: (data) => {
            setServiceStatus(data)
        },
        onError: (_) => {
            notificationError('获取服务状态失败')
        }
    })

    const workflowReq = useRequest(() => {
        return workflowName && projectName ?
            viewApiClient.getWorkflow(workflowName, projectName) :
            Promise.resolve(undefined)
    }, {
        onSuccess: (workflow) => {
            useWorkflowStore.getState().updateSingleWorkflow(workflow)
            serviceStatusReq.run(workflow)
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
        <>
            <Card
                title="工作流详情"
                extra={(<>
                    <Space direction='horizontal'>
                        {workflow && <Button
                            onClick={() => {
                                workflowReq.run()
                            }}
                        >
                            <ReloadOutlined />
                        </Button>}
                        {workflow && <Popconfirm
                            title="重新运行"
                            description="确定要重新运行当前任务吗？"
                            onConfirm={async () => {
                                const wfName = workflow?.metadata?.name
                                if (wfName) {
                                    try {
                                        await viewApiClient.rerunWorkflow(wfName, workflow.metadata?.namespace!!)
                                        await workflowReq.run()
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
                        </Popconfirm>}
                        {getWfConfigRespTag(wfConfResp) === 'submit' && <SubmitExperimentWorkflowForm
                            wfConfigRespId={wfConfResp.id}
                            experiment={experiment}
                            resourcePool={wfConfResp.resourcePool}
                            wfConfig={JSON.parse(wfConfResp.configuration) as ExperimentWorkflowConfiguration}
                            oldWorkflow={workflow}
                            key="submit"
                        />}
                    </Space>
                </>)}
            >
                {!workflow && !workflowReq.loading ? <>
                    <Typography.Title level={4}>
                        未找到对应的PaaS工作流
                    </Typography.Title>
                </>
                    :
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Spin spinning={workflowReq.loading || serviceStatusReq.loading}>
                            <ProDescriptions column={3}>
                                <ProDescriptions.Item
                                    label="状态"
                                    valueType='text'
                                >
                                    <WorkflowDisplayStatusComponent
                                        workflow={workflow}
                                        shouldWait={true}
                                        pollingInterval={1000}
                                    />
                                </ProDescriptions.Item>
                                {serviceStatus && <>
                                    <ProDescriptions.Item
                                        label="服务状态"
                                        valueEnum={{
                                            'true': {
                                                text: '健康',
                                                status: 'Success',
                                            },
                                            'false': {
                                                text: '不健康',
                                                status: 'Error',
                                            },
                                        }}
                                    >
                                        {serviceStatus.healthy}
                                    </ProDescriptions.Item>
                                    <ProDescriptions.Item
                                        label="访问服务"
                                        span={2}
                                        ellipsis
                                        valueType="text"
                                    >
                                        <Space>
                                            {serviceStatus.ports.map((port) => <>
                                                <a target="_blank" href={`http://${port.ip}:${port.nodePort}`} rel="noreferrer">
                                                    {port.ip}:{port.nodePort} - {port.name}
                                                </a>
                                            </>)}
                                        </Space>
                                    </ProDescriptions.Item>
                                </>}
                            </ProDescriptions >
                            <Collapse>
                                <Collapse.Panel header="详细配置" key='1'>
                                    <>
                                        <ProDescriptions column={3}>
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
                                    </>
                                </Collapse.Panel>
                            </Collapse>
                        </Spin >

                        <WorkflowStep
                            workflow={workflow}
                        />
                    </Space>}
            </Card>
        </>
    );
}