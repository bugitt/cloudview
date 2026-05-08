import { ModalForm, ProColumns, ProFormDigit, ProFormText, ProTable } from '@ant-design/pro-components'
import { Button, Space, Tooltip, Typography } from 'antd'
import { QuestionCircleOutlined, SyncOutlined } from '@ant-design/icons'
import React from 'react'
import { ResourcePool } from '../../../models/resource'
import { viewApiClient } from '../../../utils/cloudapi'
import { messageError, messageSuccess } from '../../../utils/notification'
import { GetColumnSearchProps } from '../../../utils/table'

interface ResourcePoolTableProps {
    resourcePoolList: ResourcePool[]
    onRefresh: () => void
    onEnsurePersonalProjects: () => void
    loading?: boolean
}

interface ResourcePoolTableType extends ResourcePool {
    key: React.Key
    name: string
}

const EditResourcePoolModal = (props: {
    record: ResourcePoolTableType
    onFinish: () => void
}) => {
    const { record, onFinish } = props
    const name = record.metadata?.name ?? ''

    const onEditFinish = async (values: any) => {
        const updated: ResourcePool = {
            apiVersion: record.apiVersion,
            kind: record.kind,
            metadata: record.metadata,
            spec: {
                capacity: {
                    cpu: values.cpu as number,
                    memory: values.memory as number,
                }
            },
            status: undefined
        }
        try {
            await viewApiClient.updateResourcePool(updated)
            messageSuccess(`资源池 ${name} 更新成功`)
            onFinish()
            return true
        } catch (e) {
            messageError(e as Error)
            return false
        }
    }

    return (
        <ModalForm
            name="edit_resource_pool"
            title={`编辑资源池 - ${name}`}
            onFinish={onEditFinish}
            autoComplete="off"
            trigger={
                <Typography.Link>编辑</Typography.Link>
            }
            initialValues={{
                cpu: record.spec?.capacity?.cpu ?? 0,
                memory: record.spec?.capacity?.memory ?? 0,
            }}
        >
            <ProFormText
                name="name"
                label="名称"
                disabled
                initialValue={name}
            />
            <ProFormDigit
                name="cpu"
                label="CPU 容量 (mCore)"
                min={0}
                rules={[{ required: true, message: '请输入 CPU 容量' }]}
            />
            <ProFormDigit
                name="memory"
                label="内存容量 (MB)"
                min={0}
                rules={[{ required: true, message: '请输入内存容量' }]}
            />
        </ModalForm>
    )
}

export const ResourcePoolTable = (props: ResourcePoolTableProps) => {
    const { resourcePoolList, onRefresh, onEnsurePersonalProjects, loading } = props

    const columns: ProColumns<ResourcePoolTableType>[] = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            ...GetColumnSearchProps<ResourcePoolTableType>('name'),
            render: (_, record) => record.metadata?.name ?? '-',
        },
        {
            title: 'CPU 容量 (mCore)',
            dataIndex: 'cpuCapacity',
            key: 'cpuCapacity',
            render: (_, record) => record.spec?.capacity?.cpu ?? 0,
        },
        {
            title: '内存容量 (MB)',
            dataIndex: 'memoryCapacity',
            key: 'memoryCapacity',
            render: (_, record) => record.spec?.capacity?.memory ?? 0,
        },
        {
            title: 'CPU 空闲 (mCore)',
            dataIndex: 'cpuFree',
            key: 'cpuFree',
            render: (_, record) => record.status?.free?.cpu ?? 0,
        },
        {
            title: '内存空闲 (MB)',
            dataIndex: 'memoryFree',
            key: 'memoryFree',
            render: (_, record) => record.status?.free?.memory ?? 0,
        },
        {
            title: '已分配数',
            dataIndex: 'usageCount',
            key: 'usageCount',
            render: (_, record) => record.status?.usage?.length ?? 0,
        },
        {
            title: '操作',
            valueType: 'option',
            key: 'option',
            render: (_, record) => (
                <Space>
                    <EditResourcePoolModal
                        record={record}
                        onFinish={onRefresh}
                    />
                </Space>
            ),
        },
    ]

    const dataSource: ResourcePoolTableType[] = resourcePoolList.map((pool, i) => ({
        key: i,
        ...pool,
        name: pool.metadata?.name ?? '',
    }))

    return (
        <ProTable<ResourcePoolTableType>
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            search={false}
            headerTitle="资源池列表"
            toolBarRender={() => [
                <Button
                    key="forceSync"
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={onEnsurePersonalProjects}
                >
                    强制同步个人项目
                    <Tooltip title="TODO">
                        <QuestionCircleOutlined style={{ marginLeft: 6, fontSize: 14 }} />
                    </Tooltip>
                </Button>,
            ]}
            options={{
                reload: onRefresh,
            }}
        />
    )
}
