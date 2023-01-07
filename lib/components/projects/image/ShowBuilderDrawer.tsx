import { Button, Descriptions, Drawer, Modal, Space, Spin, Tag } from "antd";
import { useState } from "react";
import { Builder, builderDisplayName, builderDisplayStatus, builderHistoryList, BuilderSpec, getBuilderImageUri, getImageMeta, getImageMetaFromUri, getImageUri, ImageMeta } from "../../../models/builder"
import { FaDocker } from "react-icons/fa";
import { useRequest } from "ahooks";
import { viewApiClient } from "../../../utils/cloudapi";
import { CopyOutlined } from "@ant-design/icons";
import { copyToClipboard } from "../../../utils/clipboard";
import { crdStatusTag } from "../../../utils/tag";
import { removeAuthFromUrl } from "../../../utils/url";
import { RerunImageBuilderButton } from "./RerunImageBuilderButton";
import { ProField, ProList } from "@ant-design/pro-components";
import { formatTimeStamp } from "../../../utils/date";
import { BaseCRDHistory, crdDisplayStatus } from "../../../models/crd";

interface ShowBuilderDrawerProps {
    builder: Builder
}

function BuilderDescription({ builderSpec, currentRound, status, imageMeta, startTime, endTime, history }: {
    builderSpec: BuilderSpec
    currentRound: number
    imageMeta: ImageMeta
    status: crdDisplayStatus
    startTime?: number
    endTime?: number
    history?: boolean
}) {
    const gitContext = builderSpec.context.git
    const s3Context = builderSpec.context.s3
    const raw = builderSpec.context.raw
    return (<Descriptions title={`${history ? '' : '当前'}任务状态 - #${currentRound}`} column={2}>
        <Descriptions.Item label="镜像名称">{imageMeta.name}</Descriptions.Item>
        {imageMeta.tag ? <Descriptions.Item label="镜像标签">
            {imageMeta.tag}
        </Descriptions.Item> : null}
        {imageMeta.tag ? <Descriptions.Item label="复制镜像拉取命令">
            <a onClick={() => {
                copyToClipboard(`docker pull ${getImageUri(imageMeta)}`, '镜像拉取命令')
            }}>
                <CopyOutlined />
            </a>
        </Descriptions.Item> : null}
        <Descriptions.Item label="任务状态">
            {crdStatusTag(status)}
        </Descriptions.Item>
        {startTime && startTime > 0 ? <Descriptions.Item label="开始时间">
            {formatTimeStamp(startTime * 1000)}
        </Descriptions.Item> : null}
        {endTime && endTime > 0 ? <Descriptions.Item label="结束时间">
            {formatTimeStamp(endTime * 1000)}
        </Descriptions.Item> : null}
        <Descriptions.Item label="构建方式">
            {
                gitContext ? '从Git仓库构建' :
                    s3Context ? '从压缩包构建' :
                        '直接从Dockerfile构建'
            }
        </Descriptions.Item>
        {gitContext ? (<>
            <Descriptions.Item label="Git仓库地址">
                <a href={gitContext.urlWithAuth} target="_blank" rel="noreferrer">
                    {removeAuthFromUrl(gitContext.urlWithAuth)}
                </a>
            </Descriptions.Item>
            {
                gitContext.ref ?
                    <Descriptions.Item label="Git仓库分支/Tag/Commit">
                        {gitContext.ref}
                    </Descriptions.Item> : null
            }
        </>) : null}
        {builderSpec.workspacePath ?
            <Descriptions.Item label="上下文路径">
                {builderSpec.workspacePath}
            </Descriptions.Item> : null}
        {builderSpec.dockerfilePath ?
            <Descriptions.Item label="Dockerfile路径">
                {builderSpec.dockerfilePath}
            </Descriptions.Item> : null}
        {raw ? <Descriptions.Item label="Dockerfile内容">
            <ProField
                valueType="code"
                text={raw}
                mode="read"
            />
        </Descriptions.Item> : null}
    </Descriptions>)
}

export const ShowBuilderDrawer = (props: ShowBuilderDrawerProps) => {
    const [builder, setBuilder] = useState<Builder>(props.builder)
    const builderReq = useRequest(() => viewApiClient.getImageBuilder(builder.metadata?.name || "", builder.metadata?.namespace || ""), {
        manual: true,
        onSuccess: (data) => {
            setBuilder(data)
        },
        onError: (error) => {
            // do nothing
        }
    })

    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        builderReq.mutate()
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const imageMeta = getImageMeta(builder)

    const historyList = builderHistoryList(builder)

    return (
        <>
            <Button type="primary" onClick={showDrawer}>
                查看
            </Button>
            <Drawer title={(
                <>
                    <FaDocker />
                    &nbsp;&nbsp;
                    {`镜像构建任务 - ${builderDisplayName(builder)}`}

                    &nbsp;&nbsp;
                    <Button type="primary" onClick={() => {
                        builderReq.run()
                    }}>
                        刷新
                    </Button>

                    &nbsp;&nbsp;
                    <RerunImageBuilderButton
                        builderName={builder.metadata?.name || ""}
                        projectName={imageMeta.owner || ""}
                        tag={imageMeta.tag}
                        hook={() => { builderReq.run() }}
                    />
                </>
            )}
                placement="right"
                onClose={onClose}
                width="50%"
                open={open}
            >
                <Spin spinning={builderReq.loading}>
                    <BuilderDescription
                        builderSpec={builder.spec}
                        currentRound={builder.status?.base?.currentRound || 0}
                        status={builderDisplayStatus(builder)}
                        imageMeta={imageMeta}
                        startTime={builder.status?.base?.startTime}
                        endTime={builder.status?.base?.endTime}
                    />
                    <Descriptions title="历史任务">
                    </Descriptions>
                    <ProList<BaseCRDHistory<BuilderSpec>>
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
                                        <FaDocker />
                                    )
                                }
                            },
                            description: {
                                dataIndex: 'round',
                                render: (_, row) => {
                                    return (
                                        <>
                                            <span>镜像地址：{row.spec.destination}</span>
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
                                            title: '镜像构建任务详情',
                                            width: '50%',
                                            content: (
                                                <BuilderDescription
                                                    builderSpec={row.spec}
                                                    currentRound={row.round}
                                                    status={row.status}
                                                    imageMeta={getImageMetaFromUri(row.spec.destination)}
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