import { PageHeader } from "@ant-design/pro-components"
import { Space, Descriptions } from "antd"
import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project, Repository } from "../../lib/cloudapi-client"
import { ImageListTable } from "../../lib/components/projects/image/ImageListTable"
import { ProjectFlow } from "../../lib/components/projects/ProjectFlow"
import { ResourceStatCardInProject } from "../../lib/components/projects/resource/stat/ResourceStatCard"
import { serverSideCloudapiClient } from "../../lib/utils/cloudapi"
import { formatTimeStamp } from "../../lib/utils/date"
import { setToken, ssrToken, ssrUserId } from "../../lib/utils/token"
import { BaseSSRType } from "../../lib/utils/type"

interface ProjectProps extends BaseSSRType {
    project: Project
    gitRepos: Repository[]
}

export default function SingleProjectPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { project, token, userId } = props
    setToken(token, userId)
    return (
        <>
            <PageHeader
                ghost={false}
                title={project.displayName}
                subTitle={project.description}
                onBack={() => window.history.back()}
            >
                <Space direction="vertical" style={{ display: 'flex' }}>
                    <Descriptions column={3}>
                        <Descriptions.Item label="所有者">
                            {project.owner}
                        </Descriptions.Item>
                        <Descriptions.Item label="创建时间">
                            {formatTimeStamp(project.createdTime)}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </PageHeader>
            <ProjectFlow project={project} title="工作流概览" />
            <ImageListTable project={project} />
            <ResourceStatCardInProject title="项目中各项容器部署任务资源占比" project={project} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectProps> = async (ctx) => {
    const token = ssrToken(ctx)
    const client = serverSideCloudapiClient(token)
    const projectId = Number(ctx.query.projectId)
    const project = (await client.getProjectProjectId(projectId)).data
    const gitRepos = (await client.getProjectProjectIdRepos(String(projectId))).data
    return {
        props: {
            token: ssrToken(ctx),
            userId: ssrUserId(ctx),
            project: project,
            gitRepos: gitRepos,
        },
    }
}