import { useRequest } from 'ahooks'
import { Descriptions, Space } from 'antd'
import { useParams } from 'react-router-dom'
import { cloudapiClient, formatTimeStamp } from '../../utils'
import { ContainerService } from './container/ContainerService'
import { GitService } from './git/GtiService'
import { ImageService } from './image/Images'
import { PageHeader } from '@ant-design/pro-components'

export const Project = () => {
    const projectId = useParams().projectId ?? '0'
    const { data } = useRequest(() =>
        cloudapiClient.getProjectProjectId(Number(projectId))
    )
    const project = data?.data
    return (
        <>
            <PageHeader
                ghost={false}
                title={project?.name ?? ''}
                subTitle={project?.description ?? ''}
                onBack={() => window.history.back()}
            >
                <Space direction="vertical" style={{ display: 'flex' }}>
                    <Descriptions column={3}>
                        <Descriptions.Item label="所有者">
                            {project?.owner ?? ''}
                        </Descriptions.Item>
                        <Descriptions.Item label="创建时间">
                            {project?.createdTime
                                ? formatTimeStamp(project?.createdTime)
                                : ''}
                        </Descriptions.Item>
                    </Descriptions>
                    <GitService />
                    <ImageService />
                    <ContainerService />
                </Space>
            </PageHeader>
        </>
    )
}
