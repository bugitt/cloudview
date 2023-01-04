import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project } from "../lib/cloudapi-client"
import { ProjectTable } from "../lib/components/projects/ProjectTable"
import { cloudapi } from "../lib/config/env"
import { cloudapiClient } from "../lib/utils/cloudapi"
import { setToken, ssrToken, ssrUserId } from "../lib/utils/token"
import { BaseSSRType } from "../lib/utils/type"

interface ProjectsProps extends BaseSSRType {
    projectList: Project[]
}

export default function Projects(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { projectList, token, userId } = props
    const client = cloudapiClient(token)
    setToken(token, userId)
    return (
        <>
            <ProjectTable client={client} projectList={projectList} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectsProps> = async (ctx) => {
    const token = ssrToken(ctx)
    const client = cloudapiClient(token, cloudapi.serverSideEndpoint)
    const data = (await client.getProjects()).data
    return {
        props: {
            token: ssrToken(ctx),
            userId: ssrUserId(ctx),
            projectList: data,
        },
    }
}