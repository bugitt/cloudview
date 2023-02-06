import { CheckCircleFilled, CloseCircleFilled, ClockCircleFilled, LoadingOutlined, MinusCircleFilled } from "@ant-design/icons"
import { useRequest } from "ahooks"
import { Space } from "antd"
import { useState } from "react"
import { Workflow, WorkflowDisplayStatus } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"
import { notificationError } from "../../utils/notification"

interface Props {
    workflow?: Workflow
    shouldWait?: boolean
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

export function WorkflowDisplayStatusComponent(props: Props) {
    const { workflow, shouldWait } = props
    const [workflowDisplayStatus, setWorkflowDisplayStatus] = useState<WorkflowDisplayStatus>()
    useRequest(() => {
        return workflow ? viewApiClient.getWorkflowDisplayStatus(workflow.metadata?.name!!, workflow.metadata?.namespace!!) : Promise.resolve(undefined)
    }, {
        refreshDeps: [workflow],
        onSuccess: (data) => {
            setWorkflowDisplayStatus(data)
        },
        onError: (_) => {
            notificationError('获取工作流状态失败')
        }
    })
    return (<>
        {!workflow && !shouldWait ?
            <Space>
                <MinusCircleFilled style={{
                    color: 'gray',
                }} />
                <span>未提交</span>
            </Space>
            :
            workflowDisplayStatus ?
                <Space>
                    {getWorkflowDisplayStatusIcon(workflowDisplayStatus)}
                    <span>{workflowDisplayStatus?.display}</span>
                </Space>
                :
                <LoadingOutlined />
        }
    </>)
}