import { CopyOutlined } from "@ant-design/icons"
import { ProColumns, ProTable } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Tag, Table } from "antd"
import { ColumnType } from "antd/es/table"
import { ImageRepo, Project } from "../../../cloudapi-client"
import { copyToClipboard } from "../../../utils/clipboard"
import { cloudapiClient } from "../../../utils/cloudapi"
import { randomColor } from "../../../utils/color"
import { formatTimeStamp } from "../../../utils/date"
import { notificationError } from "../../../utils/notification"
import { GetColumnSearchProps } from "../../../utils/table"
import { filesize } from 'filesize'
import { useState } from "react"

interface ImageRepoTableType {
    key: React.Key
    name: string
    artifactCount: number
    downloadCount: number
    updateTime: string
}

interface ImageArtifactTableType {
    key: React.Key
    fullName: string
    name: string
    pullCommand: string
    tags: string[]
    size: string
    pushTime: string
    pullTime: string
}

export const ImageListTable = (props: { project: Project }) => {
    const { project } = props
    const [imageRepoList, setImageRepoList] = useState<ImageRepo[]>([])
    const imageRepoListReq = useRequest(
        () => cloudapiClient.getProjectProjectIdImageRepos(String(project.id)), {
        onSuccess: (data) => {
            setImageRepoList(data.data)
        },
        onError: (_) => {
            notificationError('获取项目镜像列表失败')
        }
    }
    )

    const originData = imageRepoList.sort((a: ImageRepo, b: ImageRepo) => {
        return (b.updateTime ?? 0) - (a.updateTime ?? 0)
    })

    const columns: ProColumns<ImageRepoTableType>[] = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            ...GetColumnSearchProps<ImageRepoTableType>('name')
        },
        { title: '镜像数量', dataIndex: 'artifactCount', key: 'artifactCount' },
        { title: '下载次数', dataIndex: 'downloadCount', key: 'downloadCount' },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            sorter: (a, b) => a.updateTime.localeCompare(b.updateTime)
        }
    ]

    const subColumns: ColumnType<ImageArtifactTableType>[] = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: ImageArtifactTableType) => {
                return (
                    <div>
                        {text} &nbsp;
                        <a
                            onClick={() =>
                                copyToClipboard(
                                    `${record.fullName}`,
                                    '镜像名称'
                                )
                            }
                        >
                            <CopyOutlined />
                        </a>
                    </div>
                )
            }
        },
        {
            title: '复制拉取命令',
            dataIndex: 'pullCommand',
            key: 'pullCommand',
            render: (text, _) => {
                return (
                    <a onClick={() => copyToClipboard(text, '镜像拉取命令')}>
                        <CopyOutlined />
                    </a>
                )
            }
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            render: (_, { tags }) => (
                <>
                    {tags.map(tag => {
                        return (
                            <Tag color={randomColor(tag)} key={tag}>
                                {tag}
                            </Tag>
                        )
                    })}
                </>
            )
        },
        { title: '大小', dataIndex: 'size', key: 'size' },
        {
            title: '推送时间',
            dataIndex: 'pushTime',
            key: 'pushTime',
            sorter: (a, b) => a.pushTime.localeCompare(b.pushTime)
        },
        {
            title: '拉取时间',
            dataIndex: 'pullTime',
            key: 'pullTime',
            sorter: (a, b) => a.pullTime.localeCompare(b.pullTime)
        }
    ]

    const imageRepos: ImageRepoTableType[] =
        imageRepoList.map((item, i) => {
            return {
                key: i,
                name: item.name,
                artifactCount: item.artifactsCount ?? 0,
                downloadCount: item.downloadCount ?? 0,
                updateTime: formatTimeStamp(item.updateTime)
            }
        }) ?? []

    const expandedRowRender = (record: ImageRepoTableType) => {
        return (
            <Table<ImageArtifactTableType>
                columns={subColumns}
                dataSource={
                    originData
                        ?.find((item: ImageRepo) => item.name === record.name)
                        ?.images?.sort((a, b) => {
                            return (b.pushTime ?? 0) - (a.pushTime ?? 0)
                        })
                        ?.map((item, i) => {
                            return {
                                key: i,
                                fullName: `${item.hostPrefix}/${item.repo}@${item.digest}`,
                                name: `${item.digest.substring(0, 15)}`,
                                pullCommand: item.pullCommand,
                                tags: item.tags,
                                size: filesize(item.imageSize) as unknown as string,
                                pushTime: formatTimeStamp(item.pushTime),
                                pullTime: formatTimeStamp(item.pullTime)
                            }
                        }) ?? []
                }
                pagination={false}
                size="small"
            />
        )
    }

    return (
        <>
            <ProTable<ImageRepoTableType>
                headerTitle="镜像列表"
                loading={imageRepoListReq.loading}
                dataSource={imageRepos}
                columns={columns}
                search={false}
                options={{
                    reload: () => imageRepoListReq.run(),
                }}
                expandable={{
                    expandedRowRender: expandedRowRender,
                    rowExpandable: record => record.artifactCount > 0
                }}
                pagination={{
                    pageSize: 10
                }}
            />
        </>
    )
}
