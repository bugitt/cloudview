import { ProList } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, Descriptions, Drawer, Modal, Space, Spin, Tag } from "antd";
import { useState } from "react";
import { SiAiohttp, SiOpencontainersinitiative } from "react-icons/si";
import { Project } from "../../../cloudapi-client";
import { BaseCRDHistory, crdDisplayStatus } from "../../../models/crd";
import { Deployer, deployerDisplayStatus, deployerHistoryList, DeployerSpec, getDeployerDisplayName, ServicePort, ServiceStatus } from "../../../models/deployer";
import { viewApiClient } from "../../../utils/cloudapi";
import { formatTimeStamp } from "../../../utils/date";
import { crdStatusTag } from "../../../utils/tag";
import { RerunDeployerButton } from "./RerunDeployerButton";

interface ShowDeployerDrawerProps {
    project: Project
    deployer: Deployer
}

function DeployerDescription({ deployerSpec, currentRound, status, startTime, endTime, history, healthy }: {
    deployerSpec: DeployerSpec
    currentRound: number
    status: crdDisplayStatus
    startTime?: number
    endTime?: number
    history?: boolean
    healthy?: boolean
}) {
    const container = deployerSpec.containers[0]
    return (
        <>
            <Descriptions title={`${history ? '' : '当前'}任务状态 - #${currentRound}`} column={2}>
                <Descriptions.Item label="任务状态">
                    {crdStatusTag(status)}
                </Descriptions.Item>
                {healthy !== undefined && status === '运行中' && (
                    <>
                        <Descriptions.Item label="容器状态">
                            <Tag color={healthy ? 'green' : 'red'}>{healthy ? '健康' : '异常'}</Tag>
                        </Descriptions.Item>
                    </>
                )}
                <Descriptions.Item label="镜像">
                    {container.image}
                </Descriptions.Item>
                {startTime && startTime > 0 ? <Descriptions.Item label="任务开始时间">
                    {formatTimeStamp(startTime * 1000)}
                </Descriptions.Item> : null}
                {/* {endTime && endTime > 0 ? <Descriptions.Item label="结束时间">
                    {formatTimeStamp(endTime * 1000)}
                </Descriptions.Item> : null} */}
            </Descriptions>
        </>
    )
}

export const ShowDeployerDrawer = (props: ShowDeployerDrawerProps) => {
    const [deployer, setDeployer] = useState<Deployer>(props.deployer)
    const { project } = props
    const deployerReq = useRequest(() => viewApiClient.getDeployer(deployer.metadata?.name || "", deployer.metadata?.namespace || ""), {
        manual: true,
        onSuccess: (data) => {
            setDeployer(data)
        },
        onError: (error) => {
            // do nothing
        }
    })

    const [serviceStatus, setServiceStatus] = useState<ServiceStatus | undefined>(undefined)
    const svcStatusReq = useRequest(() => viewApiClient.getServiceStatus(deployer.metadata?.name || "", deployer.metadata?.namespace || ""), {
        manual: true,
        onSuccess: (data) => {
            setServiceStatus(data)
        },
        onError: (error) => {
            // do nothing
        }
    })

    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        deployerReq.run()
        svcStatusReq.run()
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const historyList = deployerHistoryList(deployer)

    return (
        <>
            <Button type="primary" onClick={showDrawer}>
                查看
            </Button>
            <Drawer title={(
                <>
                    <SiOpencontainersinitiative />
                    &nbsp;&nbsp;
                    {`容器部署任务 - ${getDeployerDisplayName(deployer)}`}

                    &nbsp;&nbsp;
                    <Button type="primary" onClick={() => {
                        deployerReq.run()
                        svcStatusReq.run()
                    }}>
                        刷新
                    </Button>

                    &nbsp;&nbsp;
                    <RerunDeployerButton
                        deployerName={deployer.metadata?.name || ""}
                        projectName={project.name}
                        projectId={project.id}
                        hook={() => { deployerReq.run() }}
                        image={deployer.spec.containers[0].image}
                    />
                </>
            )}
                placement="right"
                onClose={onClose}
                width="50%"
                open={open}
            >
                <Spin spinning={deployerReq.loading || svcStatusReq.loading}>
                    <DeployerDescription
                        deployerSpec={deployer.spec}
                        currentRound={deployer.status?.base?.currentRound || 0}
                        status={deployerDisplayStatus(deployer)}
                        startTime={deployer.status?.base?.startTime}
                        endTime={deployer.status?.base?.endTime}
                        healthy={serviceStatus?.healthy}
                    />
                    {serviceStatus && (
                        <>
                            <Descriptions title="服务端口">
                            </Descriptions>
                            <ProList<ServicePort>
                                toolBarRender={false}
                                rowKey="name"
                                headerTitle="服务端口"
                                dataSource={serviceStatus?.ports || []}
                                showActions="hover"
                                showExtra="hover"
                                metas={{
                                    title: {
                                        dataIndex: 'name',
                                        // render: (_, row) => {
                                        //     return (
                                        //         '任务 #' + row.round
                                        //     )
                                        // }
                                    },
                                    avatar: {
                                        dataIndex: 'name',
                                        render: () => {
                                            return (
                                                <SiAiohttp />
                                            )
                                        }
                                    },
                                    description: {
                                        dataIndex: 'name',
                                        render: (_, row) => {
                                            return (
                                                <>
                                                    <span>{row.ip}:{row.nodePort}</span>
                                                </>
                                            )
                                        }
                                    },
                                    actions: {
                                        render: (_, row) => [
                                            <a href={`http://${row.ip}:${row.nodePort}`} target="_blank" rel="noreferrer" key="view">
                                                访问
                                            </a>
                                        ],
                                    },
                                }}
                            />
                        </>
                    )}
                    <Descriptions title="历史任务">
                    </Descriptions>
                    <ProList<BaseCRDHistory<DeployerSpec>>
                        toolBarRender={false}
                        rowKey="round"
                        headerTitle="历史任务"
                        dataSource={historyList}
                        showActions="hover"
                        showExtra="hover"
                        metas={{
                            title: {
                                dataIndex: 'round',
                                render: (_, row) => {
                                    return (
                                        '任务 #' + row.round
                                    )
                                }
                            },
                            avatar: {
                                dataIndex: 'round',
                                render: () => {
                                    return (
                                        <SiOpencontainersinitiative />
                                    )
                                }
                            },
                            description: {
                                dataIndex: 'round',
                                render: (_, row) => {
                                    return (
                                        <>
                                            <span>镜像：{row.spec.containers[0].image}</span>
                                            {
                                                (row.startTime && row.startTime > 0) || (row.endTime && row.endTime > 0) ?
                                                    <>
                                                        <br />
                                                        <span>
                                                            <Space>
                                                                <span>{row.startTime && row.startTime > 0 ? '开始时间：' + formatTimeStamp(row.startTime * 1000) : null}</span>
                                                                <span>{row.endTime && row.endTime > 0 ? '结束时间：' + formatTimeStamp(row.endTime * 1000) : null}</span>
                                                            </Space>
                                                        </span>
                                                    </>
                                                    : null
                                            }
                                        </>
                                    )
                                }
                            },
                            subTitle: {
                                dataIndex: 'round',
                                render: (_, row) => {
                                    return crdStatusTag(row.status, true)
                                },
                            },
                            actions: {
                                render: (_, row) => [
                                    <a onClick={() => {
                                        Modal.info({
                                            title: '容器部署任务详情',
                                            width: '50%',
                                            content: (
                                                <DeployerDescription
                                                    deployerSpec={row.spec}
                                                    currentRound={row.round}
                                                    status={row.status}
                                                    startTime={row.startTime}
                                                    endTime={row.endTime}
                                                    history={true}
                                                />
                                            ),
                                        })
                                    }} key="view">
                                        详情
                                    </a>
                                ],
                            },
                        }}
                    />
                </Spin>
            </Drawer>
        </>
    );
}