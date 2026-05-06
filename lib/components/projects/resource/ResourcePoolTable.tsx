import { ModalForm, ProColumns, ProFormDigit, ProFormInstance, ProFormRadio, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components'
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd'
import React, { useRef } from 'react'
import { ResourcePool } from '../../../models/resource'
import { viewApiClient } from '../../../utils/cloudapi'
import { messageError, messageSuccess } from '../../../utils/notification'
import { GetColumnSearchProps } from '../../../utils/table'

interface ResourcePoolTableProps {
    resourcePoolList: ResourcePool[]
    onRefresh: () => void
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

const CreateResourcePoolModal = (props: {
    onFinish: () => void
}) => {
    const { onFinish } = props
    const formRef = useRef<ProFormInstance>()

    const onCreateFinish = async (values: any) => {
        const newPool: ResourcePool = {
            apiVersion: 'cloudapi.scs.buaa.edu.cn/v1alpha1',
            kind: 'ResourcePool',
            metadata: {
                name: values.name,
                labels: {
                    'cloudapi.scs.buaa.edu.cn/assigned-user': values.userId,
                },
            },
            spec: {
                capacity: {
                    cpu: values.cpu,
                    memory: values.memory,
                }
            },
            status: undefined,
        }
        try {
            await viewApiClient.createResourcePool(newPool)
            messageSuccess(`资源池 ${values.name} 创建成功`)
            onFinish()
            return true
        } catch (e) {
            messageError(e as Error)
            return false
        }
    }

    return (
        <ModalForm
            name="create_resource_pool"
            title="创建资源池"
            onFinish={onCreateFinish}
            autoComplete="off"
            formRef={formRef}
            trigger={
                <Button type="primary">创建资源池</Button>
            }
        >
            <ProFormRadio.Group
                name="searchType"
                label="用户搜索方式"
                options={[
                    { label: '按姓名', value: 'ByName' },
                    { label: '按ID', value: 'ById' },
                ]}
                initialValue="ByName"
            />
            <ProFormSelect
                name="userId"
                label="分配给用户"
                showSearch
                debounceTime={300}
                request={async (params) => {
                    if (!params.keyWords) return []
                    const searchType = formRef.current?.getFieldValue('searchType') || 'ByName'
                    const users = await viewApiClient.searchUser(searchType, params.keyWords)
                    return users.map((u: { id: string, name: string }) => ({
                        label: `${u.name} (${u.id})`,
                        value: u.id,
                    }))
                }}
                rules={[{ required: true, message: '请搜索并选择用户' }]}
            />
            <ProFormText
                name="name"
                label="资源池名称"
                rules={[{ required: true, message: '请输入资源池名称' }]}
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
    const { resourcePoolList, onRefresh, loading } = props

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
            render: (_, record) => {
                const hasUsage = (record.status?.usage?.length ?? 0) > 0
                const poolName = record.metadata?.name ?? ''
                return (
                    <Space>
                        <EditResourcePoolModal
                            record={record}
                            onFinish={onRefresh}
                        />
                        <Popconfirm
                            title="删除资源池"
                            description={`确定要删除资源池 ${poolName} 吗？`}
                            onConfirm={async () => {
                                try {
                                    await viewApiClient.deleteResourcePool(poolName)
                                    messageSuccess(`资源池 ${poolName} 已删除`)
                                    onRefresh()
                                } catch (e) {
                                    messageError(e as Error)
                                }
                            }}
                            okText="是"
                            cancelText="否"
                        >
                            <Tooltip title={hasUsage ? '资源池上仍有工作负载运行，无法删除' : undefined}>
                                <Typography.Link
                                    type='danger'
                                    disabled={hasUsage}
                                >
                                    删除
                                </Typography.Link>
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                )
            },
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
            options={{
                reload: onRefresh,
            }}
            toolBarRender={() => [
                <CreateResourcePoolModal key="create" onFinish={onRefresh} />,
            ]}
        />
    )
}
