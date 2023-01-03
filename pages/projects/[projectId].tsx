import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project, Repository } from "../../lib/cloudapi-client"
import { ProjectFlow } from "../../lib/components/projects/ProjectFlow"
import { cloudapiClient } from "../../lib/utils/cloudapi"
import { ssrToken, ssrUserId } from "../../lib/utils/token"
import { BaseSSRType } from "../../lib/utils/type"

interface ProjectProps extends BaseSSRType {
    project: Project
    gitRepos: Repository[]
}

export default function SingleProjectPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { project, token, gitRepos } = props
    const client = cloudapiClient(token)
    return (
        <>
            <h1>
                {project.name}
            </h1>
            <ProjectFlow project={project} client={client} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectProps> = async (ctx) => {
    const token = ssrToken(ctx)
    const client = cloudapiClient(token, process.env.CLOUDAPI_URL)
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