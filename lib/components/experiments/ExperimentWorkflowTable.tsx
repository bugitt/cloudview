import { LoadingOutlined } from "@ant-design/icons"
import { ProColumns, ProTable } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Drawer, Space, Typography } from "antd"
import { useState } from "react"
import { ExperimentResponse, UserModel } from "../../cloudapi-client"
import { ServiceStatus } from "../../models/deployer"
import { getWfConfFromExperiment, Workflow } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"
import { notificationError } from "../../utils/notification"
import { WorkflowDisplayStatusComponent } from "../workflow/WorkflowDisplayStatusComponent"
import { WorkflowDescription } from "./WorkflowDescription"

interface Props {
    experiment: ExperimentResponse
    tag: string
    studentList: UserModel[]
}

interface DataType {
    key: React.Key
    studentId: string
    studentName: string
    startTime?: number
    workflowName?: string
    workflow?: Workflow
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

export function ExperimentWorkflowTable(props: Props) {
    const { experiment, tag, studentList } = props
    const isJob = !!getWfConfFromExperiment(experiment)?.isJob
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
            title: '访问服务',
            dataIndex: 'workflowName',
            hideInSearch: true,
            render: (_, record) => {
                return record.workflow ?
                    <ServicePortList workflow={record.workflow} />
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
                    if (record.workflow) {
                        setCurrentWorkflow(record.workflow)
                        setWorkflowDetailDrawer(true)
                    }
                }}
                disabled={!record.workflow}
            >
                查看详情
            </Typography.Link>,
        ],
        align: 'center',
    },)

    return (<>
        <ProTable<DataType>
            columns={columns}
            request={async (params, sort, filter) => {
                let thisStudentList = studentList
                if (params.studentName) {
                    thisStudentList = thisStudentList.filter(stu => stu.name.includes(params.studentName))
                }
                if (params.studentId) {
                    thisStudentList = thisStudentList.filter(stu => stu.id.includes(params.studentId))
                }
                const workflowList = (await viewApiClient.listWorkflowsByExperiment(experiment.id, tag))

                const currentPage = params.current || 1
                const pageSize = params.pageSize || defaultPageSize
                const dataList: DataType[] = thisStudentList
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((student, index) => {
                        const workflow = workflowList.find(wf => wf.metadata?.labels?.owner === student.id)
                        return {
                            key: index,
                            studentId: student.id,
                            studentName: student.name,
                            workflowName: workflow?.metadata?.name,
                            workflow,
                            startTime: workflow?.status?.base?.startTime ? workflow?.status?.base?.startTime * 1000 : undefined,
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
        {currentWorkflow && <Drawer
            width='50%'
            placement="right"
            closable={false}
            onClose={() => {
                setWorkflowDetailDrawer(false)
            }}
            title="工作流详情"
            open={workflowDetailDrawer}>
            <WorkflowDescription
                experiment={experiment}
                wfConfResp={experiment.workflowExperimentConfiguration!!}
                projectName={currentWorkflow.metadata?.namespace!!}
            />
        </Drawer>}
    </>)
}