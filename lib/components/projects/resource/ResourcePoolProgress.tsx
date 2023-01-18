import { Progress } from 'antd'
import { Resource, ResourcePool } from '../../../models/resource'

interface ResourcePoolProgressProps {
    resourcePool: ResourcePool
}

export const ResourcePoolProgress = ({ resourcePool }: ResourcePoolProgressProps) => {
    const { capacity } = resourcePool.spec
    const { free } = resourcePool.status
    const used: Resource = {
        cpu: capacity.cpu - free.cpu,
        memory: capacity.memory - free.memory,
    }
    return (
        <div>
            <span>
                <b>{resourcePool.metadata?.name!!}</b>
            </span>
            <br />
            <div style={{ width: 170 }}>
                <Progress
                    width={100}
                    size="small"
                    percent={(used.cpu / capacity.cpu) * 100}
                    format={() =>
                        `CPU： ${used.cpu} / ${capacity.cpu} mCore`
                    }
                />
                <br />
                <Progress
                    size="small"
                    percent={(used.memory / capacity.memory) * 100}
                    format={() =>
                        `内存： ${used.memory} / ${capacity.memory} MB`
                    }
                />
            </div>
        </div>
    )
}

