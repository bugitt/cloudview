import { LoadingOutlined } from "@ant-design/icons"
import { ProColumns, ProTable } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Badge, Drawer, Popconfirm, Space, Typography } from "antd"
import { useState } from "react"
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from "../../cloudapi-client"
import { ServiceStatus } from "../../models/deployer"
import { ExperimentWorkflowConfiguration, getWfConfigRespTag, getWorkflowExpId, getWorkflowName, getWorkflowNamespace, getWorkflowOwner, setupWorkflow, Workflow, WorkflowDisplayStatus } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"
import { notificationSuccess } from "../../utils/notification"
import { WorkflowDisplayStatusComponent } from "../workflow/WorkflowDisplayStatusComponent"
import { useWorkflowStore } from "../workflow/workflowStateManagement"
import { WorkflowDescription } from "./WorkflowDescription"

interface Props {
    experiment: ExperimentResponse
    wfConfigResp: ExperimentWorkflowConfigurationResponse
}

interface DataType {
    key: React.Key
    studentId: string
    studentName: string
    startTime?: number
    workflowName?: string
    workflow?: Workflow
    serviceStatus?: ServiceStatus
    displayStatus?: WorkflowDisplayStatus
}

const defaultPageSize = 10

function ServicePortList({ workflow }: { workflow: Workflow }) {
    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>()
    useRequest(() => {
        return workflow && workflow.spec.deploy.type === 'service' ? viewApiClient.getServiceStatus(workflow.metadata?.name!!, workflow.metadata?.namespace!!) : Promise.resolve(undefined)
    }, {
        refreshDeps: [workflow],
        onSuccess: (data) => {
            setServiceStatus(data)
        },
        onError: (_) => {
            // notificationError('获取服务状态失败')
        }
    })
    return (
        serviceStatus && workflow ?
            <Space>
                {serviceStatus.ports.map((port) => <>
                    <a target="_blank" href={`http://${port.ip}:${port.nodePort}`} rel="noreferrer">
                        {port.name}
                    </a>
                </>)}
            </Space>
            :
            <LoadingOutlined />
    )
}

export function ExperimentWorkflowTable(props: Props) {
    const { experiment, wfConfigResp } = props
    const isJob = (JSON.parse(wfConfigResp.configuration) as ExperimentWorkflowConfiguration).isJob ?? false
    const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>()
    const [workflowDetailDrawer, setWorkflowDetailDrawer] = useState(false)

    const columns: ProColumns<DataType>[] = [
        {
            title: '序号',
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            search: false,
        },
        {
            title: '学号',
            dataIndex: 'studentId',
            valueType: 'text',
        },
        {
            title: '姓名',
            dataIndex: 'studentName',
            valueType: 'text',
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
    ]

    if (!isJob) {
        columns.push({
            title: '服务状态',
            dataIndex: 'workflowName',
            hideInSearch: true,
            render: (_, record) => {
                return record.serviceStatus ?
                    record.serviceStatus.healthy ? <Badge status="success" text="健康" /> : <Badge status="error" text="不健康" />
                    : <> - </>
            }
        })
    }

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
            wfConfigResp.needSubmit ? <></> :
                <Popconfirm
                    key='setup'
                    title="执行工作流"
                    description={`确定要执行学生 ${record.studentId} ${record.studentName} 的工作流吗？`}
                    onConfirm={async () => {
                        await setupWorkflow(wfConfigResp, experiment.id, [record.studentId], undefined, record.workflow)
                    }}
                >
                    <Typography.Link>
                        {(record.workflow ? '重新' : '') + '执行工作流'}
                    </Typography.Link>
                </Popconfirm>,
            record.workflow ? <Popconfirm
                key='delete'
                title="删除工作流"
                description={`确定要删除学生 ${record.studentId} ${record.studentName} 的工作流吗？`}
                onConfirm={async () => {
                    await viewApiClient.deleteWorkflow(getWorkflowName(record.workflow)!!, getWorkflowNamespace(record.workflow)!!)
                    notificationSuccess('删除成功')
                }}
            >
                <Typography.Link type='danger'>
                    删除工作流
                </Typography.Link>
            </Popconfirm> : <></>,

        ],
        align: 'center',
    },)

    return (<>
        <ProTable<DataType>
            columns={columns}
            request={async (params, sort, filter) => {
                const currentPage = params.current || 1
                const pageSize = params.pageSize || defaultPageSize
                let filteredStudentList = wfConfigResp.studentList
                if (params.studentName) {
                    filteredStudentList = filteredStudentList.filter(stu => stu.name.includes(params.studentName))
                }
                if (params.studentId) {
                    filteredStudentList = filteredStudentList.filter(stu => stu.id.includes(params.studentId))
                }
                const thisStudentList = filteredStudentList
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                const workflowRespList = await useWorkflowStore.getState().refreshWorkflowMapByExpIdAndTag(experiment.id, getWfConfigRespTag(wfConfigResp), thisStudentList.map(it => it.id))

                const dataList: DataType[] = thisStudentList
                    .map((student, index) => {
                        const workflowResp = workflowRespList.find(wfResp => getWorkflowOwner(wfResp.workflow) === student.id && getWorkflowExpId(wfResp.workflow) === experiment.id)
                        const workflow = workflowResp?.workflow
                        return {
                            key: index,
                            studentId: student.id,
                            studentName: student.name,
                            workflowName: getWorkflowName(workflow),
                            workflow,
                            startTime: workflow?.status?.base?.startTime ? workflow?.status?.base?.startTime * 1000 : undefined,
                            serviceStatus: workflowResp?.serviceStatus,
                            displayStatus: workflowResp?.displayStatus,
                        }
                    })
                return {
                    data: dataList,
                    success: true,
                    total: filteredStudentList.length,
                    page: currentPage,
                }
            }}
            rowKey="studentId"
            search={{
                filterType: 'light',
            }}
            pagination={{
                pageSize: defaultPageSize,
            }}
            dateFormatter="string"
            headerTitle="工作流执行情况"
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
                    experiment={experiment}
                    wfConfResp={wfConfigResp}
                    workflowName={getWorkflowName(currentWorkflow)!!}
                    projectName={currentWorkflow?.metadata?.namespace!!}
                />
            </Drawer>
        }
    </>)
}