import React from 'react'
import { ProColumns, ProTable } from '@ant-design/pro-table'
import { useParams } from 'react-router-dom'
import { useRequest } from 'ahooks'
import {
    cloudapiClient,
    formatTimeStamp,
    getColumnSearchProps
} from '../../utils'
import {
    ContainerResponse,
    ContainerServiceResponse
} from '../../cloudapi-client'
import { Button, Modal, Popconfirm, Space, Tag } from 'antd'
import { ContainerServiceDetail } from './ContainerServiceDetail'
import { CreateContainerServiceForm } from './CreateContainerServiceForm'

export interface ContainerServiceTableType {
    key: React.Key
    id: number
    name: string
    serviceType: string
    status: string
    creator: string
    createdTime: string
    containers: ContainerResponse[]
}

export const ContainerServiceListTable = () => {
    const projectId = useParams().projectId ?? '0'
    const { data, loading } = useRequest(
        () => cloudapiClient.getProjectProjectIdContainers(projectId),
        { pollingInterval: 1000 }
    )

    const convertServiceType = (srcText: string): string => {
        if (srcText === 'service') {
            return '守护进程'
        } else {
            return '单次任务'
        }
    }

    const serviceList: ContainerServiceTableType[] =
        data?.data
            ?.sort((a, b) => b.createdTime - a.createdTime)
            .map((service: ContainerServiceResponse, i) => {
                return {
                    key: i,
                    id: service.id,
                    name: service.name,
                    serviceType: service.serviceType.toLowerCase(),
                    status: service.status.toLowerCase(),
                    creator: service.creator,
                    createdTime: formatTimeStamp(service.createdTime),
                    containers: service.containers
                }
            }) || []

    const showContainerServiceDetail = (
        containerService: ContainerServiceTableType
    ) => {
        Modal.info({
            title: `容器服务 ${containerService.name} 详情`,
            content: (
                <ContainerServiceDetail containerService={containerService} />
            ),
            width: 1000,
            okText: '关闭',
            onOk() {}
        })
    }

    const columns: ProColumns<ContainerServiceTableType>[] = [
        {
            title: '服务名称',
            dataIndex: 'name',
            key: 'name',
            ...getColumnSearchProps('name')
        },
        {
            title: '服务类型',
            dataIndex: 'serviceType',
            key: 'serviceType',
            filters: true,
            onFilter: true,
            ellipsis: true,
            valueType: 'select',
            valueEnum: {
                service: {
                    text: '守护进程'
                },
                job: {
                    text: '单次任务'
                }
            },
            render: (text, record) => {
                return (
                    <Tag
                        color={
                            record.serviceType === 'service'
                                ? 'geekblue'
                                : 'green'
                        }
                    >
                        {convertServiceType(record.serviceType)}
                    </Tag>
                )
            }
        },
        {
            title: '服务状态',
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
                    color: 'orange'
                },
                not_ready: {
                    text: '部署中',
                    status: 'Processing'
                },
                running: {
                    text: '运行中',
                    status: 'Processing',
                    color: 'green'
                },
                success: {
                    text: '完成',
                    status: 'Success'
                },
                fail: {
                    text: '失败',
                    status: 'Error'
                }
            }
        },
        {
            title: '创建者',
            dataIndex: 'creator',
            key: 'creator',
            ...getColumnSearchProps('creator')
        },
        {
            title: '最新运行/部署时间',
            dataIndex: 'createdTime',
            key: 'createdTime',
            sorter: (a, b) => a.createdTime.localeCompare(b.createdTime)
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={() => showContainerServiceDetail(record)}>
                        详情
                    </a>
                    <Popconfirm
                        title={`确定要重新运行/部署服务 ${record.name} 吗？`}
                        onConfirm={() =>
                            cloudapiClient.postProjectProjectIdContainersRerun(
                                projectId,
                                record.id.toString()
                            )
                        }
                    >
                        <a>
                            {record.serviceType === 'job'
                                ? '重新运行'
                                : '重新部署'}
                        </a>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <>
            <ProTable<ContainerServiceTableType>
                headerTitle="容器服务列表"
                search={false}
                loading={!data && loading}
                columns={columns}
                dataSource={serviceList}
                toolBarRender={() => [
                    <CreateContainerServiceForm projectId={projectId} />
                ]}
            />
        </>
    )
}
