import { ProColumns, ProTable } from "@ant-design/pro-components"
import { ExperimentResponse, UserModel } from "../../cloudapi-client"
import { Workflow } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"

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

export function ExperimentWorkflowTable(props: Props) {
    const { experiment, tag, studentList } = props

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
            title: '开始时间',
            dataIndex: 'startTime',
            valueType: 'dateTime',
            hideInSearch: true,
        },
    ]

    return (<>
        <ProTable<DataType>
            columns={columns}
            request={async (params, sort, filter) => {
                const currentPage = params.current || 1
                const pageSize = params.pageSize || defaultPageSize
                const workflowList = (await viewApiClient.listWorkflowsByExperiment(experiment.id, tag)).slice((currentPage - 1) * pageSize, currentPage * pageSize)
                const dataList: DataType[] = studentList
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
                    total: studentList.length,
                    page: currentPage,
                }
            }}
            rowKey="studentId"
            search={{
                labelWidth: 'auto',
            }}
            pagination={{
                pageSize: defaultPageSize,
            }}
            dateFormatter="string"
            headerTitle="工作流执行情况"
        />
    </>)
}