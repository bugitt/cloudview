import * as k8s from '@kubernetes/client-node';
import { ProColumns, ProTable } from '@ant-design/pro-components'
import { useState } from 'react';
import { useRequest } from 'ahooks';
import { viewApiClient } from '../utils/cloudapi';
import { notificationError } from '../utils/notification';
import { GetColumnSearchProps } from '../utils/table';
import { Space, Typography, Popconfirm } from 'antd';
import { KubeObjectModal } from './KubeObjectModal';

interface Props {
    namespaceList: string[]
}

interface DataType {
    key: React.Key,
    name: string,
    phase?: string,
    namespace: string,
    podIP?: string,
    hostname?: string,
    hostIP?: string,
    message?: string,
    createdTime?: Date,
    pod: k8s.V1Pod,
}

export function PodTable(props: Props) {
    const [pods, setPods] = useState<k8s.V1Pod[]>([])
    const podListReq = useRequest(async () => {
        const nsList = props.namespaceList.length === 0 ? ["all-ns"] : props.namespaceList
        return (await Promise.all(
            nsList.map(async (ns) => {
                return (await viewApiClient.getPodListByNamespace(ns)).items
            })
        )).flat()
    }, {
        onSuccess: (data) => {
            setPods(data)
        },
        onError: () => {
            notificationError('获取容器组列表失败')
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
            ...GetColumnSearchProps<DataType>('name'),
        },
        {
            title: '状态',
            dataIndex: 'phase',
            valueType: 'text',
            ...GetColumnSearchProps<DataType>('phase'),
        },
        {
            title: '命名空间',
            dataIndex: 'namespace',
            valueType: 'text',
            sortDirections: ['ascend', 'descend'],
            sorter: (a, b) => { return a.namespace.localeCompare(b.namespace) }
        },
        {
            title: '容器组IP',
            dataIndex: 'podIP',
            valueType: 'text',
            ...GetColumnSearchProps<DataType>('podIP'),
        },
        {
            title: '主机名',
            dataIndex: 'hostname',
            valueType: 'text',
            ...GetColumnSearchProps<DataType>('hostname'),
        },
        {
            title: '主机IP',
            dataIndex: 'hostIP',
            valueType: 'text',
            ...GetColumnSearchProps<DataType>('hostIP'),
        },
        {
            title: '创建时间',
            dataIndex: 'createdTime',
            valueType: 'dateTime',
        },
        {
            title: '操作',
            key: 'option',
            valueType: 'option',
            render: (_, record) => {
                return <>
                    <Space>
                        <>

                            <KubeObjectModal obj={record.pod} hook={() => { podListReq.run() }} />
                        </>
                        <Popconfirm
                            title="删除Pod"
                            description={`确定要删除Pod ${record.name} 吗？`}
                            onConfirm={async () => {
                                await viewApiClient.deleteKubeObject(record.pod)
                                podListReq.run()
                            }}
                            okText="是"
                            cancelText="否"
                        >
                            <Typography.Link type='danger'>
                                删除
                            </Typography.Link>
                        </Popconfirm>
                    </Space>
                </>
            }
        }
    ]
    return (
        <>
            <ProTable<DataType>
                options={{
                    reload: () => podListReq.run(),
                }}
                loading={podListReq.loading}
                search={false}
                dataSource={
                    pods.map((pod, index) => {
                        return {
                            key: index,
                            name: pod.metadata!!.name!!,
                            namespace: pod.metadata!!.namespace!!,
                            phase: pod.status?.phase,
                            podIP: pod.status?.podIP,
                            hostname: pod.spec?.nodeName,
                            hostIP: pod.status?.hostIP,
                            message: pod.status?.message,
                            createdTime: pod.metadata?.creationTimestamp,
                            pod: pod,
                        }
                    })
                        .sort((pod1, pod2) => {
                            if (!pod1.createdTime || !pod2.createdTime) return 1
                            return pod1.createdTime < pod2.createdTime ? 1 : -1
                        })
                }
                columns={columns}
                headerTitle='容器组列表'
            />
        </>
    )
}