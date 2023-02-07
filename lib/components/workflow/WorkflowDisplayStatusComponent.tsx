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
    pollingInterval?: number
}

function getWorkflowDisplayStatusIcon(status?: WorkflowDisplayStatus): React.ReactNode {
    if (!status) return <></>
    switch (status.status) {
        case 'Success':
            return <CheckCircleFilled style={{
                color: 'green',
            }} />

        case 'Error':
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
    const { workflow, shouldWait, pollingInterval } = props
    const [workflowDisplayStatus, setWorkflowDisplayStatus] = useState<WorkflowDisplayStatus>()
    useRequest(() => {
        return workflow ? viewApiClient.getWorkflowDisplayStatus(workflow.metadata?.name!!, workflow.metadata?.namespace!!) : Promise.resolve(undefined)
    }, {
        pollingInterval: pollingInterval,
        refreshDeps: [workflow],
        onSuccess: (data) => {
            setWorkflowDisplayStatus(data)
        },
        onError: (_) => {
            !pollingInterval && notificationError('获取工作流状态失败')
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