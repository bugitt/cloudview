import { Button, Descriptions, Drawer, Spin } from "antd";
import { useState } from "react";
import { Builder, builderDisplayName, builderDisplayStatus, getBuilderImageUri, getImageMeta } from "../../../models/builder"
import { FaDocker } from "react-icons/fa";
import { useRequest } from "ahooks";
import { viewApiClient } from "../../../utils/cloudapi";
import { CopyOutlined } from "@ant-design/icons";
import { copyToClipboard } from "../../../utils/clipboard";
import { crdStatusTag } from "../../../utils/tag";
import { removeAuthFromUrl } from "../../../utils/url";
import { RerunImageBuilderButton } from "./RerunImageBuilderButton";
import { ProField } from "@ant-design/pro-components";
import { formatTimeStamp } from "../../../utils/date";

interface ShowBuilderDrawerProps {
    builder: Builder
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
    const builderSpec = builder.spec
    const gitContext = builder.spec.context.git
    const s3Context = builder.spec.context.s3
    const raw = builder.spec.context.raw
    const baseStatus = builder.status?.base
    const currentRound = baseStatus?.currentRound || 0

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
                    <Descriptions title={`当前任务状态 - #${currentRound}`}>
                        <Descriptions.Item label="镜像名称">{imageMeta.name}</Descriptions.Item>
                        {imageMeta.tag ? <Descriptions.Item label="镜像标签">
                            {imageMeta.tag}
                        </Descriptions.Item> : null}
                        {imageMeta.tag ? <Descriptions.Item label="复制镜像拉取命令">
                            <a onClick={() => {
                                copyToClipboard(`docker pull ${getBuilderImageUri(builder)}`, '镜像拉取命令')
                            }}>
                                <CopyOutlined />
                            </a>
                        </Descriptions.Item> : null}
                        <Descriptions.Item label="任务状态">
                            {crdStatusTag(builderDisplayStatus(builder))}
                        </Descriptions.Item>
                        {baseStatus?.startTime && baseStatus?.startTime > 0 ? <Descriptions.Item label="开始时间">
                            {formatTimeStamp(baseStatus?.startTime * 1000)}
                        </Descriptions.Item> : null}
                        {baseStatus?.endTime && baseStatus?.endTime > 0 ? <Descriptions.Item label="结束时间">
                            {formatTimeStamp(baseStatus?.endTime * 1000)}
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
                                <a href={gitContext.urlWithAuth}>
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
                    </Descriptions>
                </Spin>
            </Drawer>
        </>
    );
}