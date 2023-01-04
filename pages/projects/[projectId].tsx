import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project, Repository } from "../../lib/cloudapi-client"
import { ProjectFlow } from "../../lib/components/projects/ProjectFlow"
import { serverSideCloudapiClient } from "../../lib/utils/cloudapi"
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
            <h1>
                {project.name}
            </h1>
            <ProjectFlow project={project} />
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