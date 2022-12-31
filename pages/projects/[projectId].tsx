import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { useRouter } from "next/router"
import { Project } from "../../lib/cloudapi-client"
import { cloudapiClient } from "../../lib/utils/cloudapi"
import { ssrToken, ssrUserId } from "../../lib/utils/token"
import { BaseSSRType } from "../../lib/utils/type"

interface ProjectProps extends BaseSSRType {
    project: Project
}

export default function SingleProject(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()
    const { project, token } = props
    const client = cloudapiClient(token)
    return (
        <>
            <div>
                <h1>
                    {project.name}
                </h1>
            </div>
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectProps> = async (ctx) => {
    const token = ssrToken(ctx)
    const client = cloudapiClient(token, process.env.CLOUDAPI_URL)
    const projectId = Number(ctx.query.projectId)
    const data = (await client.getProjectProjectId(projectId)).data
    return {
        props: {
            token: ssrToken(ctx),
            userId: ssrUserId(ctx),
            project: data,
        },
    }
}