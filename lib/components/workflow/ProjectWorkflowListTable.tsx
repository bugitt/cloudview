import { ProColumns, ProTable } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Badge, Drawer, Popconfirm, Typography } from "antd";
import { useState } from "react";
import { Project } from "../../cloudapi-client";
import { getCrdDisplayName } from "../../models/crd";
import { ServiceStatus } from "../../models/deployer";
import { getWorkflowName, getWorkflowNamespace, Workflow, WorkflowDisplayStatus, WorkflowResponse } from "../../models/workflow";
import { viewApiClient } from "../../utils/cloudapi";
import { notificationSuccess } from "../../utils/notification";
import { WorkflowDescription } from "../experiments/WorkflowDescription";
import { PersonalCreateWorkflowForm } from "./PersonalCreateWorkflowForm";
import { WorkflowDisplayStatusComponent } from "./WorkflowDisplayStatusComponent";

interface Props {
    project: Project
}

interface DataType {
    key: React.Key
    name: string
    startTime?: number
    displayStatus?: WorkflowDisplayStatus
    serviceStatus?: ServiceStatus
    workflow: Workflow
}

export function ProjectWorkflowListTable(props: Props) {
    const { project } = props
    const [workflowList, setWorkflowList] = useState<DataType[]>([])
    const req = useRequest(() => viewApiClient.listWorkflowResponses(project.name), {
        onSuccess: (data) => {
            const dataList: DataType[] = data.sort((a, b) => (b.workflow?.status?.base?.startTime || 0) - (a.workflow?.status?.base?.startTime || 0))
                .map((wfResp: WorkflowResponse, index: number) => {
                    const workflow = wfResp.workflow
                    return {
                        key: index,
                        name: getCrdDisplayName(wfResp.workflow),
                        workflow: wfResp.workflow,
                        startTime: workflow?.status?.base?.startTime ? workflow?.status?.base?.startTime * 1000 : undefined,
                        displayStatus: wfResp.displayStatus,
                        serviceStatus: wfResp.serviceStatus,
                    }
                })
            setWorkflowList(dataList)
        }
    })
    const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>()
    const [workflowDetailDrawer, setWorkflowDetailDrawer] = useState(false)
    const columns: ProColumns<DataType>[] = [
        {
            title: '工作流名称',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            ellipsis: true,
            copyable: true,
            search: false,
        },
        {
            title: '部署时间',
            dataIndex: 'startTime',
            valueType: 'dateTime',
            hideInSearch: true,
        },
        {
            title: '工作流状态',
            dataIndex: 'displayStatus',
            render: (_, record) => {
                return <WorkflowDisplayStatusComponent
                    displayStatus={record.displayStatus}
                    workflow={record.workflow}
                    shouldWait={false}
                />
            },
            hideInSearch: true,
        },
        {
            title: '服务状态',
            dataIndex: 'workflowName',
            hideInSearch: true,
            render: (_, record) => {
                return record.serviceStatus ?
                    record.serviceStatus.healthy ? <Badge status="success" text="健康" /> : <Badge status="error" text="不健康" />
                    : <> - </>
            }
        }
    ]

    columns.push({
        title: '操作',
        width: 180,
        key: 'option',
        valueType: 'option',
        render: (_, record) => [
            <Typography.Link
                key="detail"
                onClick={() => {
                    setWorkflowDetailDrawer(true)
                    if (record.workflow) {
                        setCurrentWorkflow(record.workflow)
                        setWorkflowDetailDrawer(true)
                    }
                }}
                disabled={!record.workflow}
            >
                查看详情
            </Typography.Link>,
            record.workflow ? <Popconfirm
                key='delete'
                title="删除工作流"
                description={`确定要删除工作流 ${getCrdDisplayName(record.workflow)} 吗？`}
                onConfirm={async () => {
                    await viewApiClient.deleteWorkflow(getWorkflowName(record.workflow)!!, getWorkflowNamespace(record.workflow)!!)
                    notificationSuccess('删除成功')
                    req.run()
                }}
            >
                <Typography.Link type='danger'>
                    删除工作流
                </Typography.Link>
            </Popconfirm> : <></>,
        ],
    })
    return (<>
        <ProTable<DataType>
            options={{
                reload: () => req.run()
            }}
            loading={req.loading}
            search={false}
            headerTitle="工作流列表"
            dataSource={workflowList}
            columns={columns}
            toolBarRender={() => [
                <PersonalCreateWorkflowForm key='create' project={project} hook={() => { req.run() }} />,
            ]}
        />

        {currentWorkflow &&
            <Drawer
                width='50%'
                placement="right"
                closable={false}
                onClose={() => {
                    setWorkflowDetailDrawer(false)
                    setCurrentWorkflow(undefined)
                }}
                open={workflowDetailDrawer}>
                <WorkflowDescription
                    personal={true}
                    project={project}
                    workflowName={getWorkflowName(currentWorkflow)!!}
                    projectName={currentWorkflow?.metadata?.namespace!!}
                />
            </Drawer>
        }
    </>)
}