import { ContainerResponse } from '../../../cloudapi-client'
import { Card, Descriptions, List } from 'antd'

interface ContainerInfoCardProps {
    container: ContainerResponse
}

export const ContainerInfoCard = (props: ContainerInfoCardProps) => {
    const { container } = props
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
                {container.envs ? (
                    <Descriptions.Item label="环境变量">
                        {container.envs.map(env => (
                            <p>{`${env.key} = ${env.value}`}</p>
                        ))}
                    </Descriptions.Item>
                ) : null}
            </Descriptions>
        </Card>
    )
}
