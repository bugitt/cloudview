import { ProCard, StatisticCard } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { useState } from "react"
import { Project } from "../../../../cloudapi-client"
import { NamespacedName } from "../../../../models/crd"
import { Deployer, getDeployerDisplayName } from "../../../../models/deployer"
import { ResourcePool } from "../../../../models/resource"
import { viewApiClient } from "../../../../utils/cloudapi"
import { notificationError } from "../../../../utils/notification"
import { ResourceStatChart } from "./ResourceStatChart"


export interface StatDataType {
    value: number
    name: string
}

export const ResourceStatCardInProject = (props: {
    title: string
    project: Project
}) => {
    const { title, project } = props
    const cpuData: StatDataType[] = []
    const memoryData: StatDataType[] = []

    const [resourcePoolList, setResourceList] = useState<ResourcePool[]>([])
    const resourcePoolReq = useRequest(() => viewApiClient.getProjectResourcePools(project.id), {
        onSuccess: (data) => {
            setResourceList(data)
        },
        onError: (_) => {
            notificationError('获取项目资源池列表失败')
        }
    })

    resourcePoolList.forEach((pool) => {
        pool.spec.usage.forEach(usage => {
            if (usage.namespacedName.namespace === project.name) {
                cpuData.push({
                    name: usage.displayName,
                    value: usage.resource.cpu
                })
                memoryData.push({
                    name: usage.displayName,
                    value: usage.resource.memory
                })
            }
        })
    })

    return (
        <ProCard title={title} split="vertical">
            <StatisticCard
                title={null}
                chart={<ResourceStatChart data={cpuData} type="cpu" />}
            />
            <StatisticCard
                title={null}
                chart={<ResourceStatChart data={memoryData} type="memory" />}
            />
        </ProCard>
    )
}
