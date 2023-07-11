import * as k8s from '@kubernetes/client-node';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { viewApiClient } from '../utils/cloudapi';
import { notificationError } from '../utils/notification';
import { ProColumns, ProTable } from '@ant-design/pro-components'
import { KubeObjectModal } from './KubeObjectModal';
import { formatFileSize } from '../utils/file';

interface Props {
}

interface DataType {
    key: React.Key,
    name: string,
    ip: string,
    status: string,
    cpuCapacity: string,
    memoryCapacity: string,
    cpuAllocatable: string,
    memoryAllocatable: string,
    node: k8s.V1Node,
}

const formatKubeNodeMemory = (mem?: string) => {
    if (!mem) return ''
    return formatFileSize(parseInt(mem) * 1024)
}

export function KubeNodeTable(props: Props) {
    const [nodes, setNodes] = useState<k8s.V1Node[]>([])
    const nodeListReq = useRequest(async () => {
        return (await viewApiClient.getKubeNodeList()).items
    }, {
        onSuccess: (data) => {
            setNodes(data)
        },
        onError: () => {
            notificationError('获取Node列表失败')
        }
    })

    const columns: ProColumns<DataType>[] = [
        {
            title: '序号',
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            search: false,
        },
        {
            title: '名称',
            dataIndex: 'name',
            valueType: 'text',
        },
        {
            title: 'IP',
            dataIndex: 'ip',
            valueType: 'text',
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueType: 'text',
        },
        {
            title: 'CPU容量',
            dataIndex: 'cpuCapacity',
            valueType: 'text',
        },
        {
            title: 'CPU可分配',
            dataIndex: 'cpuAllocatable',
            valueType: 'text',
        },
        {
            title: '内存容量',
            dataIndex: 'memoryCapacity',
            valueType: 'text',
        },
        {
            title: '内存可分配',
            dataIndex: 'memoryAllocatable',
            valueType: 'text',
        },
        {
            title: '操作',
            valueType: 'option',
            render: (text, record, _, action) => [
                <KubeObjectModal
                    key='edit'
                    obj={record.node}
                    title='Node'
                    hook={() => {
                        nodeListReq.run()
                    }}
                />,
            ],
        },
    ]


    return (<>
        <ProTable<DataType>
            columns={columns}
            dataSource={nodes.map((node, index) => {
                return {
                    key: index,
                    name: node.metadata?.name || '',
                    ip: node.status?.addresses?.find((addr) => addr.type === 'InternalIP')?.address || '',
                    status: node.status?.conditions?.find((cond) => cond.type === 'Ready')?.type || '',
                    cpuCapacity: node.status?.capacity?.cpu || '',
                    memoryCapacity: formatKubeNodeMemory(node.status?.capacity?.memory) || '',
                    cpuAllocatable: node.status?.allocatable?.cpu || '',
                    memoryAllocatable: formatKubeNodeMemory(node.status?.allocatable?.memory) || '',
                    node: node,
                }
            })}
            loading={nodeListReq.loading}
            search={false}
            headerTitle='Kubernetes节点列表'
        />

    </>)
}