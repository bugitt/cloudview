import {ProjectIdProps} from "../../assets/types";
import React from "react";
import {ProColumns, ProTable} from "@ant-design/pro-table";
import {Tag} from "antd";
import {cloudapiClient, formatTimeStamp, getColumnSearchProps, messageError, randomColor} from "../../utils";
import {useRequest} from "ahooks";
import {ImageBuildTask} from "../../cloudapi-client";

interface ImageBuildTaskTableType {
    key: React.Key;
    hostPrefix: string;
    repoName: string;
    tag: string;
    status: string;
    createdTime: string;
    endTime: string;
}

export const ImageBuildTaskListTable = (props: ProjectIdProps) => {
    const {
        data,
        loading,
        error
    } = useRequest(() => cloudapiClient.getProjectProjectIdImageBuildTasks(props.projectId), {
        pollingInterval: 5000,
    })
    messageError(error)

    const imageBuildTaskList: ImageBuildTaskTableType[] = (data?.data ?? []).sort((a: ImageBuildTask, b: ImageBuildTask) => {
        return (b.createdTime ?? 0) - (a.createdTime ?? 0)
    }).map((imageBuildTask: ImageBuildTask, i) => {
        return {
            key: i,
            hostPrefix: imageBuildTask.hostPrefix,
            repoName: imageBuildTask.repo,
            tag: imageBuildTask.tag,
            status: imageBuildTask.status.toLowerCase(),
            createdTime: formatTimeStamp(imageBuildTask.createdTime),
            endTime: formatTimeStamp(imageBuildTask.endTime),
        }
    })

    const columns: ProColumns<ImageBuildTaskTableType>[] = [
        {
            title: '镜像名称',
            dataIndex: 'repoName',
            key: 'repoName',
            ...getColumnSearchProps<ImageBuildTaskTableType>('repoName')
        },
        {
            title: '任务状态',
            dataIndex: 'status',
            key: 'status',
            filters: true,
            onFilter: true,
            ellipsis: true,
            valueType: 'select',
            valueEnum: {
                undo: {
                    text: '排队中',
                    status: 'Processing',
                    color: 'orange',
                },
                doing: {
                    text: '运行中',
                    status: 'Processing',
                },
                success: {
                    text: '完成',
                    status: 'Success',
                },
                fail: {
                    text: '失败',
                    status: 'Error',
                },
            },
        },
        {
            title: '标签',
            dataIndex: 'tag',
            key: 'tag',
            ...getColumnSearchProps<ImageBuildTaskTableType>('tag', undefined, (dom, entity) => {
                return (
                    <Tag color={randomColor(entity.tag)} key={entity.tag}>
                        {dom}
                    </Tag>
                )
            })
        },
        {
            title: '创建时间',
            dataIndex: 'createdTime',
            key: 'createdTime',
            sorter: (a, b) => a.createdTime.localeCompare(b.createdTime)
        },
        {
            title: '结束时间',
            dataIndex: 'endTime',
            key: 'endTime',
            sorter: (a, b) => a.endTime.localeCompare(b.endTime)
        },
    ]

    return (
        <ProTable<ImageBuildTaskTableType>
            headerTitle="镜像构建任务列表"
            loading={!data && loading}
            dataSource={imageBuildTaskList}
            columns={columns}
            search={false}
            pagination={{
                pageSize: 10
            }}
        />

    )
}
