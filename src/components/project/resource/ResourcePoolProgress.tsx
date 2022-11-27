import { Progress } from 'antd'
import { ResourcePool } from '../../../cloudapi-client/api'

interface ResourcePoolProgressProps {
    resourcePool: ResourcePool
}

export const ResourcePoolProgress = (props: ResourcePoolProgressProps) => {
    const { name, used, capacity } = props.resourcePool
    return (
        <div>
            <span>
                <b>{name}</b>
            </span>
            <br />
            <div style={{ width: 170 }}>
                <Progress
                    size="small"
                    percent={(used.cpu / capacity.cpu) * 100}
                    format={() => `CPU： ${used.cpu} / ${capacity.cpu} mCore`}
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
