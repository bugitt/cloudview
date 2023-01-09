import { ProCard, StatisticCard } from "@ant-design/pro-components"
import { NamespacedName } from "../../../../models/crd"
import { Deployer, getDeployerDisplayName } from "../../../../models/deployer"
import { ResourcePool } from "../../../../models/resource"
import { ResourceStatChart } from "./ResourceStatChart"


export interface StatDataType {
    value: number
    name: string
}

export const ResourceStatCard = (props: {
    title: string
    poolList: ResourcePool[]
    deployerList: Deployer[]
}) => {
    const { title, poolList, deployerList } = props
    const findDeployerDisplayName = (nsN: NamespacedName) => {
        for (const deployer of deployerList) {
            if (deployer.metadata?.name === nsN.name && deployer.metadata?.namespace === nsN.namespace) {
                return getDeployerDisplayName(deployer)
            }
        }
        return undefined
    }
    const cpuData: StatDataType[] = []
    const memoryData: StatDataType[] = []

    poolList.forEach((pool) => {
        pool.spec.usage.forEach(usage => {
            const displayName = findDeployerDisplayName(usage.namespacedName)
            if (displayName) {
                cpuData.push({
                    name: displayName,
                    value: usage.resource.cpu
                })
                memoryData.push({
                    name: displayName,
                    value: usage.resource.memory
                })
            }
        })
    })

    return (
        <ProCard title={title} split="horizontal">
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
