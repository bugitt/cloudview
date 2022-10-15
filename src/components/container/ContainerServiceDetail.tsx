import { Card, Space } from 'antd'
import { ContainerInfoCard } from './ContainerInfoCard'
import { ContainerServiceTableType } from './ContainerServiceListTable'
import {
    ContainerServicePortWithContainerName,
    PortListTable
} from './PortListTable'

interface ContainerServiceDetailProps {
    containerService: ContainerServiceTableType
}

export const ContainerServiceDetail = (props: ContainerServiceDetailProps) => {
    const { containerService } = props
    const containerServicePortWithContainerNameList: ContainerServicePortWithContainerName[] =
        containerService.containers
            .map(container => {
                return (
                    container?.ports?.map(port => {
                        return {
                            containerName: container.name,
                            ...port
                        }
                    }) || []
                )
            })
            .flat()
    return (
        <>
            <Space direction="vertical" style={{ display: 'flex' }}>
                {containerServicePortWithContainerNameList.length > 0 ? (
                    <Card>
                        <PortListTable
                            ports={containerServicePortWithContainerNameList}
                        />
                    </Card>
                ) : null}

                {containerService.containers.map(container => (
                    <ContainerInfoCard container={container} />
                ))}
            </Space>
        </>
    )
}
