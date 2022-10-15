import { ContainerServicePort } from '../../cloudapi-client'
import React from 'react'
import { ColumnType } from 'antd/es/table'
import { Table, Tag } from 'antd'
import { randomColor } from '../../utils'

export interface ContainerServicePortWithContainerName
    extends ContainerServicePort {
    containerName: string
}

interface PortTableType extends ContainerServicePortWithContainerName {
    key: React.Key
}

interface PortListTableTypeProps {
    ports: ContainerServicePortWithContainerName[]
}

export const PortListTable = (props: PortListTableTypeProps) => {
    const { ports } = props
    const portList: PortTableType[] = ports.map((port, i) => {
        return {
            key: i,
            ...port
        }
    })
    let columns: ColumnType<PortTableType>[] = [
        { title: '端口名称', dataIndex: 'name', key: 'name' },
        { title: '所属容器', dataIndex: 'containerName', key: 'containerName' },
        { title: '端口', dataIndex: 'port', key: 'port' },
        {
            title: '协议',
            dataIndex: 'protocol',
            key: 'protocol',
            render: text => <Tag color={randomColor(text)}>{text}</Tag>
        },
        { title: '访问IP', dataIndex: 'exportIP', key: 'exportIP' },
        { title: '访问端口', dataIndex: 'exportPort', key: 'exportPort' },
        {
            title: '访问地址',
            key: 'exportEntrypoint',
            render: (text, record) => {
                if (!record.exportIP || !record.exportPort) {
                    return null
                }
                const entrypoint = `${record.exportIP}:${record.exportPort}`
                return (
                    <a href={`http://${entrypoint}`} target="_blank">
                        {entrypoint}
                    </a>
                )
            }
        }
    ]
    return (
        <Table
            columns={columns}
            dataSource={portList}
            pagination={false}
            size="small"
        />
    )
}
