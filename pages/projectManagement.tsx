import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project } from "../lib/cloudapi-client"
import { ProjectTable } from "../lib/components/projects/ProjectTable"
import { serverSideCloudapiClient } from "../lib/utils/cloudapi"
import { setToken, ssrToken, ssrUserId } from "../lib/utils/token"
import { BaseSSRType } from "../lib/utils/type"

interface ProjectsProps extends BaseSSRType {
    projectList: Project[]
}

export default function Projects(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { projectList, token, userId } = props
    setToken(token, userId)
    return (
        <>
            <ProjectTable projectList={projectList} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectsProps> = async (ctx) => {
    const token = ssrToken(ctx)
    const client = serverSideCloudapiClient(token)
    const data = (await client.getProjects()).data
    return {
        props: {
            token: token,
            userId: ssrUserId(ctx),
            projectList: data,
        },
    }
}