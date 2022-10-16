import { useRequest } from 'ahooks'
import { PageHeader, Button, Descriptions, Space } from 'antd'
import { useParams } from 'react-router-dom'
import { cloudapiClient } from '../../utils'
import { ContainerService } from '../container/ContainerService'
import { GitService } from '../git/GtiService'
import { ImageService } from '../image/Images'

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
            >
                <Space direction="vertical" style={{ display: 'flex' }}>
                    <Descriptions column={3}>
                        <Descriptions.Item label="所有者">
                            {project?.owner ?? ''}
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
