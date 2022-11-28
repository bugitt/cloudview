import ProCard, { StatisticCard } from '@ant-design/pro-card'
import { useEffect, useState } from 'react'
import { ResourcePool } from '../../../../cloudapi-client'
import { cloudapiClient, notificationError } from '../../../../utils'
import { ResourcePoolCpuStat } from './ResourcePoolCpuStat'

export interface StatDataType {
    value: number
    name: string
}

export const ResourceStatCard = (props: {
    title: string
    pool: ResourcePool
}) => {
    const { title, pool } = props
    const [cpuData, setCpuData] = useState<StatDataType[]>([])
    const [memoryData, setMemoryData] = useState<StatDataType[]>([])

    useEffect(() => {
        cloudapiClient
            .getStatResourcePoolsResourcePoolIdUsed(pool.id)
            .then(data => {
                setCpuData(data.data.cpu)
                setMemoryData(data.data.memory)
            })
            .catch(err => {
                notificationError(err)
            })
    }, [pool])

    return (
        <ProCard title={title} split="vertical">
            <StatisticCard
                title={null}
                chart={<ResourcePoolCpuStat data={cpuData} type="cpu" />}
            />
            <StatisticCard
                title={null}
                chart={<ResourcePoolCpuStat data={memoryData} type="memory" />}
            />
        </ProCard>
    )
}
