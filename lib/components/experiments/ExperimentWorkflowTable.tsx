import { LoadingOutlined } from "@ant-design/icons"
import { ProColumns, ProTable } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Badge, Drawer, Popconfirm, Space, Typography } from "antd"
import { useState } from "react"
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from "../../cloudapi-client"
import { BuilderContext } from "../../models/builder"
import { ServiceStatus } from "../../models/deployer"
import { CreateWorkflowRequest, ExperimentWorkflowConfiguration, getWfConfigRespTag, getWorkflowExpId, getWorkflowName, getWorkflowOwner, UpdateWorkflowRequest, Workflow } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"
import { messageSuccess, notificationError } from "../../utils/notification"
import { WorkflowDisplayStatusComponent } from "../workflow/WorkflowDisplayStatusComponent"
import { useWorkflowStore } from "../workflow/workflowStateManagement"
import { workflowTemplates } from "../workflow/workflowTemplates"
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
    serviceStatus?: boolean
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
            notificationError('获取服务状态失败')
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

function ServiceStatus({ workflow }: { workflow: Workflow }) {
    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>()
    useRequest(() => {
        return workflow && workflow.spec.deploy.type === 'service' ? viewApiClient.getServiceStatus(workflow.metadata?.name!!, workflow.metadata?.namespace!!) : Promise.resolve(undefined)
    }, {
        refreshDeps: [workflow],
        onSuccess: (data) => {
            setServiceStatus(data)
        },
        onError: (_) => {
            notificationError('获取服务状态失败')
        }
    })
    return (
        serviceStatus && workflow ?
            serviceStatus.healthy ?
                <Badge status="success" text="健康" />
                : <Badge status="error" text="不健康" />
            :
            <LoadingOutlined />
    )
}

async function setupWorkflow(wfConfigResp: ExperimentWorkflowConfigurationResponse, expId: number, ownerId: string, context?: BuilderContext, oldWorkflow?: Workflow) {
    const wfConfig = JSON.parse(wfConfigResp.configuration) as ExperimentWorkflowConfiguration
    const wfTemplate = workflowTemplates.find(wf => wf.name === wfConfig.workflowTemplateName)
    const req: CreateWorkflowRequest = {
        confRespId: wfConfigResp.id,
        ownerId: ownerId,
        tag: getWfConfigRespTag(wfConfigResp),
        expId: expId,
        context: context,
        baseImage: wfConfig.baseImage,
        templateKey: wfTemplate?.key ?? 'custom',
        compileCommand: wfConfig.buildSpec?.command,
        deployCommand: wfConfig.deploySpec?.command,
        ports: wfConfig.deploySpec.ports,
        env: wfConfig.deploySpec.env,
    }

    try {
        if (oldWorkflow) {
            const updateReq: UpdateWorkflowRequest = {
                workflowName: oldWorkflow?.metadata?.name!!,
                ...req
            }
            await viewApiClient.updateWorkflow(updateReq)
        } else {
            await viewApiClient.createWorkflow(req)
        }
        messageSuccess('提交成功')
        return true
    } catch (_) {
        notificationError('提交失败')
        return false
    }
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
            title: '工作流状态',
            dataIndex: 'workflow',
            render: (_, record) => {
                return <WorkflowDisplayStatusComponent
                    workflow={record.workflow}
                    shouldWait={false}
                />
            },
            hideInSearch: true,
        },
        {
            title: '部署时间',
            dataIndex: 'startTime',
            valueType: 'dateTime',
            hideInSearch: true,
        },
    ]

    if (!isJob) {
        columns.push({
            title: '服务状态',
            dataIndex: 'workflowName',
            hideInSearch: true,
            render: (_, record) => {
                return record.workflow ?
                    <ServiceStatus workflow={record.workflow} />
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
                    onConfirm={() => {
                        setupWorkflow(wfConfigResp, experiment.id, record.studentId, undefined, record.workflow)
                    }}
                >
                    <Typography.Link>
                        执行工作流
                    </Typography.Link>
                </Popconfirm>,

        ],
        align: 'center',
    },)

    return (<>
        <ProTable<DataType>
            columns={columns}
            request={async (params, sort, filter) => {
                const currentPage = params.current || 1
                const pageSize = params.pageSize || defaultPageSize
                let thisStudentList = wfConfigResp.studentList
                if (params.studentName) {
                    thisStudentList = thisStudentList.filter(stu => stu.name.includes(params.studentName))
                }
                if (params.studentId) {
                    thisStudentList = thisStudentList.filter(stu => stu.id.includes(params.studentId))
                }
                await useWorkflowStore.getState().refreshWorkflowMapByExpIdAndTag(experiment.id, getWfConfigRespTag(wfConfigResp))
                const workflowList = Array.from(useWorkflowStore.getState().workflowMap.values())

                const dataList: DataType[] = thisStudentList
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((student, index) => {
                        const workflow = workflowList.find(wf => getWorkflowOwner(wf) === student.id && getWorkflowExpId(wf) === experiment.id)
                        return {
                            key: index,
                            studentId: student.id,
                            studentName: student.name,
                            workflowName: getWorkflowName(workflow),
                            workflow,
                            startTime: workflow?.status?.base?.startTime ? workflow?.status?.base?.startTime * 1000 : undefined,
                            serviceStatus: true,
                        }
                    })
                return {
                    data: dataList,
                    success: true,
                    total: thisStudentList.length,
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