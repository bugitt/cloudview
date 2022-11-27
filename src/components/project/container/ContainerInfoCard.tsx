import { ContainerResponse } from '../../../cloudapi-client'
import { Card, Descriptions, List } from 'antd'
import { useRequest } from 'ahooks'
import { cloudapiClient, notificationError } from '../../../utils'
import { ResourcePoolProgress } from '../resource/ResourcePoolProgress'

interface ContainerInfoCardProps {
    container: ContainerResponse
}

export const ContainerInfoCard = (props: ContainerInfoCardProps) => {
    const { container } = props
    const resourceUsedRecordReq = useRequest(() =>
        cloudapiClient.getResourceUsedRecordsResourceUsedRecordId(
            container.resourceUsedRecordId
        )
    )
    notificationError(resourceUsedRecordReq.error)
    const resource = resourceUsedRecordReq.data?.data.resource
    return (
        <Card bordered={true}>
            <Descriptions
                title={`容器信息：${container.name}`}
                bordered
                size="small"
            >
                <Descriptions.Item label="镜像">
                    {container.image}
                </Descriptions.Item>
                {resource ? (
                    <Descriptions.Item label="资源限额">
                        {resource.cpu} mCore CPU
                        <br />
                        {resource.memory} MB 内存
                    </Descriptions.Item>
                ) : null}
                {container.envs ? (
                    <Descriptions.Item label="环境变量">
                        {container.envs.map(env => (
                            <p>{`${env.key} = ${env.value}`}</p>
                        ))}
                    </Descriptions.Item>
                ) : null}
                {container.command ? (
                    <Descriptions.Item label="启动命令">
                        {container.command}
                    </Descriptions.Item>
                ) : null}
                {container.workingDir ? (
                    <Descriptions.Item label="工作路径">
                        {container.workingDir}
                    </Descriptions.Item>
                ) : null}
                <Descriptions.Item label="资源池">
                    <ResourcePoolProgress
                        resourcePoolId={container.resourcePoolId}
                    />
                </Descriptions.Item>
            </Descriptions>
        </Card>
    )
}
