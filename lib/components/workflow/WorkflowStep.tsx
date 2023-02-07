import { UserOutlined, SolutionOutlined, LoadingOutlined, SmileOutlined, ClockCircleOutlined, ContainerOutlined, CheckOutlined, ReloadOutlined } from "@ant-design/icons"
import { useRequest } from "ahooks"
import { Button, Card, Space, Spin, StepProps, Steps, Typography } from "antd"
import TextArea from "antd/es/input/TextArea"
import moment from "moment"
import { useState } from "react"
import { Builder } from "../../models/builder"
import { Deployer } from "../../models/deployer"
import { Workflow, WorkflowDisplayStatus } from "../../models/workflow"
import { cloudapiClient, viewApiClient } from "../../utils/cloudapi"
import { notificationError } from "../../utils/notification"
import { PodLogTerminal } from "../logs/PodLogTerminal"

interface Props {
    workflow?: Workflow
}

export function BuilderDetail({ builder }: { builder?: Builder }) {
    const [logContent, setLogContent] = useState<string>()
    const logReq = useRequest(() => {
        const podWorker = builder?.status?.base?.podWorker
        return podWorker ? cloudapiClient.getContainerLog(builder?.metadata?.namespace!!, podWorker.name) : Promise.resolve(undefined)
    }, {
        pollingInterval: 1000,
        onSuccess: (data) => {
            setLogContent(data?.data)
        }
    })
    return (
        <Card title="编译构建详情" extra={[
            <Button
                key="refresh"
                onClick={() => {
                    logReq.run()
                }}
            >
                <ReloadOutlined />
            </Button>
        ]}>
            {
                builder && logContent ?
                    <>
                        <TextArea
                            value={logContent}
                            style={{
                                height: 500,
                            }} />
                    </>
                    : <>
                        <Typography.Title level={4}>初始化中，请稍后……</Typography.Title>
                    </>
            }
        </Card >
    )
}

export function DeployerDetail({ deployer }: { deployer?: Deployer }) {
    const [logContent, setLogContent] = useState<string>()
    const logReq = useRequest(() => {
        const podWorker = deployer?.status?.base?.podWorker
        return podWorker ? cloudapiClient.getContainerLog(deployer?.metadata?.namespace!!, podWorker.name) : Promise.resolve(undefined)
    }, {
        pollingInterval: 1000,
        onSuccess: (data) => {
            setLogContent(data?.data)
        }
    })
    return (
        <Card title="编译构建详情" extra={[
            <Button
                key="refresh"
                onClick={() => {
                    logReq.run()
                }}
            >
                <ReloadOutlined />
            </Button>
        ]}>
            {
                deployer && logContent ?
                    <>
                        <TextArea
                            value={logContent}
                            style={{
                                height: 500,
                            }} />
                    </>
                    : <>
                        <Typography.Title level={4}>初始化中，请稍后……</Typography.Title>
                    </>
            }
        </Card >
    )
}

export function WorkflowStep(props: Props) {
    const { workflow } = props
    const [workflowDisplayStatus, setWorkflowDisplayStatus] = useState<WorkflowDisplayStatus>()
    useRequest(() => {
        return workflow ? viewApiClient.getWorkflowDisplayStatus(workflow.metadata?.name!!, workflow.metadata?.namespace!!) : Promise.resolve(undefined)
    }, {
        pollingInterval: 1000,
        onSuccess: (data) => {
            setWorkflowDisplayStatus(data)
        },
    })

    const preStatus = (): 'finish' | 'process' | 'wait' | 'error' => {
        if (!workflowDisplayStatus) return 'wait'
        switch (workflowDisplayStatus.stage) {
            case 'Pending':
                return workflowDisplayStatus.status === 'Error' ? 'error' : 'process'
            case 'Building':
            case 'Deploying':
            case 'Serving':
            case 'Doing':
            case 'Done':
                return 'finish'
            default:
                return 'error'
        }
    }

    const buildStatus = (): 'finish' | 'process' | 'wait' | 'error' => {
        if (!workflowDisplayStatus) return 'wait'
        switch (workflowDisplayStatus.stage) {
            case 'Pending':
                return 'wait'
            case 'Building':
                return workflowDisplayStatus.status === 'Error' ? 'error' : 'process'
            case 'Deploying':
            case 'Serving':
            case 'Doing':
            case 'Done':
                return 'finish'
            default:
                return 'error'
        }
    }

    const deployStatus = (): 'finish' | 'process' | 'wait' | 'error' => {
        if (!workflowDisplayStatus) return 'wait'
        switch (workflowDisplayStatus.stage) {
            case 'Pending':
                return 'wait'
            case 'Building':
                return 'wait'
            case 'Deploying':
            case 'Doing':
                return workflowDisplayStatus.status === 'Error' ? 'error' : 'process'
            case 'Serving':
            case 'Done':
                return workflowDisplayStatus.status === 'Error' ? 'error' : 'finish'
            default:
                return 'error'
        }
    }

    const buildDescription = () => {
        const builder = workflowDisplayStatus?.builder
        if (!builder) return undefined
        const startTime = builder.status?.base?.startTime ? moment(builder.status?.base?.startTime * 1000).format('YYYY-MM-DD HH:mm:ss') : undefined
        const endTime = builder.status?.base?.endTime ? moment(builder.status?.base?.endTime * 1000).format('YYYY-MM-DD HH:mm:ss') : undefined
        let description = ''
        if (startTime) {
            description += `开始时间：${startTime}`
        }
        if (endTime) {
            description += `结束时间：${endTime}`
        }
        return (<>
            {startTime && <span>开始时间：{startTime}</span>}
            {endTime && <> <br /> <span>结束时间：{endTime}</span> </>}
        </>)
    }

    const deployDescription = () => {
        const deployer = workflowDisplayStatus?.deployer
        if (!deployer) return undefined
        const startTime = deployer.status?.base?.startTime ? moment(deployer.status?.base?.startTime * 1000).format('YYYY-MM-DD HH:mm:ss') : undefined
        const endTime = deployer.status?.base?.endTime ? moment(deployer.status?.base?.endTime * 1000).format('YYYY-MM-DD HH:mm:ss') : undefined
        let description = ''
        if (startTime) {
            description += `开始时间：${startTime}\n`
        }
        if (endTime) {
            description += `结束时间：${endTime}`
        }
        return (<>
            {startTime && <span>开始时间：{startTime}</span>}
            {endTime && <> <br /> <span>结束时间：{endTime}</span> </>}
        </>)
    }

    const items: StepProps[] = [
        {
            title: '初始化',
            status: preStatus(),
            icon: preStatus() === 'process' ? <LoadingOutlined /> : <SolutionOutlined />,
        },
        {
            title: '编译构建',
            status: buildStatus(),
            icon: buildStatus() === 'process' ? <LoadingOutlined /> : <ContainerOutlined />,
            // description: buildDescription(),
        },
        {
            title: '部署',
            status: deployStatus(),
            icon: deployStatus() === 'process' ? <LoadingOutlined /> : <CheckOutlined />,
            // description: deployDescription(),
        },
    ]

    const getInitCurrent = () => {
        const current = items.findIndex((item) => item.status === 'process')
        return items[2].status === 'finish' ? 2 : current
    }

    const [current, setCurrent] = useState<number>(getInitCurrent())

    return (<>
        <Spin spinning={!workflowDisplayStatus}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Steps
                    items={items}
                    current={current}
                    onChange={(current) => {
                        setCurrent(current)
                    }}
                >
                </Steps>

                {current === 1 && <BuilderDetail builder={workflowDisplayStatus?.builder} />}
                {current === 2 && <DeployerDetail deployer={workflowDisplayStatus?.deployer} />}
            </Space>
        </Spin>
    </>)
}