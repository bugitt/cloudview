import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project } from "../lib/cloudapi-client"
import { ProjectTable } from "../lib/components/projects/ProjectTable"
import { serverSideCloudapiClient } from "../lib/utils/cloudapi"
import { setUserInfo, ssrUserInfo } from "../lib/utils/token"
import { BaseSSRType } from "../lib/utils/type"

interface ProjectsProps extends BaseSSRType {
    projectList: Project[]
}

export default function Projects(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { projectList, userInfo } = props
    setUserInfo(userInfo)
    return (
        <>
            <ProjectTable projectList={projectList} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectsProps> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const data = (await client.getProjects()).data
    return {
        props: {
            userInfo: userInfo,
            projectList: data,
        },
    }
}