import ProTable, { ProColumns } from '@ant-design/pro-table'
import { useRequest } from 'ahooks'
import { Modal, Space } from 'antd'
import { useState } from 'react'
import { ResourcePool } from '../../../cloudapi-client'
import { cloudapiClient, notificationError } from '../../../utils'
import { ResourceStatCard } from './stat/ResourceStatCard'

interface ResourcePoolListTableType extends ResourcePool {
    key: React.Key
    capacityCpu: number
    capacityMemory: number
    usedCpu: number
    usedMemory: number
}

export const ResourcePoolListTable = () => {
    const [pools, setPools] = useState<ResourcePool[]>([])
    const { run, loading } = useRequest(
        () => cloudapiClient.getResourcePools(),
        {
            onSuccess: data => {
                setPools(data.data)
            },
            onError: error => {
                notificationError(error)
            }
        }
    )
    const [statModalOpen, setStatModalOpen] = useState(false)
    const [statModalTitle, setStatModalTitle] = useState('')
    const [statModalResourcePool, setStatModalResourcePool] =
        useState<ResourcePool>()
    const columns: ProColumns<ResourcePoolListTableType>[] = [
        {
            title: '资源池名称',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: '容量',
            children: [
                {
                    title: 'CPU（mCore）',
                    dataIndex: 'capacityCpu',
                    key: 'capacityCpu'
                },
                {
                    title: '内存（MB）',
                    dataIndex: 'capacityMemory',
                    key: 'capacityMemory'
                }
            ]
        },
        {
            title: '已用',
            children: [
                {
                    title: 'CPU（mCore）',
                    dataIndex: 'usedCpu',
                    key: 'usedCpu'
                },
                {
                    title: '内存（MB）',
                    dataIndex: 'usedMemory',
                    key: 'usedMemory'
                }
            ]
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a
                        onClick={() => {
                            setStatModalOpen(true)
                            setStatModalTitle(
                                `资源池${record.name} - 资源使用情况统计`
                            )
                            setStatModalResourcePool(record)
                        }}
                    >
                        查看使用详情
                    </a>
                </Space>
            )
        }
    ]

    const dataSource: ResourcePoolListTableType[] =
        pools?.map(pool => {
            return {
                key: pool.id,
                capacityCpu: pool.capacity.cpu,
                capacityMemory: pool.capacity.memory,
                usedCpu: pool.used.cpu,
                usedMemory: pool.used.memory,
                ...pool
            }
        }) ?? []

    const [cpuStatData, setCpuStatData] = useState([])

    return (
        <>
            <ProTable<ResourcePoolListTableType>
                options={{
                    reload: () => {
                        run()
                    }
                }}
                loading={loading}
                headerTitle="资源池列表"
                search={false}
                columns={columns}
                dataSource={dataSource}
            />
            <Modal
                open={statModalOpen}
                title={null}
                footer={null}
                onCancel={() => {
                    setStatModalOpen(false)
                }}
                width="70%"
            >
                <ResourceStatCard
                    title={statModalTitle}
                    pool={statModalResourcePool!!}
                />
            </Modal>
        </>
    )
}
