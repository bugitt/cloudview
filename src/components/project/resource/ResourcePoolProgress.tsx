import { Progress } from 'antd'
import { useEffect, useState } from 'react'
import { ResourcePool } from '../../../cloudapi-client'
import { cloudapiClient, notificationError } from '../../../utils'

interface ResourcePoolProgressProps {
    resourcePoolId?: string
    resourcePool?: ResourcePool
}

export const ResourcePoolProgress = (props: ResourcePoolProgressProps) => {
    const getResourcePool = async () => {
        if (props.resourcePool) return props.resourcePool
        const resp = await cloudapiClient.getResourcePoolResourcePoolId(
            props.resourcePoolId!!
        )

        return resp.data
    }
    const [resourcePool, setResourcePool] = useState<ResourcePool | undefined>(
        undefined
    )
    useEffect(() => {
        getResourcePool()
            .then(resourcePool => {
                setResourcePool(resourcePool)
            })
            .catch(err => {
                notificationError(err)
            })
    }, [props.resourcePoolId, props.resourcePool])
    if (!resourcePool) {
        return null
    } else {
        const { name, used, capacity } = resourcePool
        return (
            <div>
                <span>
                    <b>{name}</b>
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
}
