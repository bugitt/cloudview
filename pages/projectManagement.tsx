import { ProDescriptions } from "@ant-design/pro-components"
import { Space, Alert, Typography, Button } from "antd"
import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { Project } from "../lib/cloudapi-client"
import { ResetPaaSTokenButton } from "../lib/components/auth/ResetPaaSTokenButton"
import { ProjectTable } from "../lib/components/projects/ProjectTable"
import { copyToClipboard } from "../lib/utils/clipboard"
import { serverSideCloudapiClient } from "../lib/utils/cloudapi"
import { setUserInfo, ssrUserInfo } from "../lib/utils/token"
import { BaseSSRType } from "../lib/utils/type"

interface ProjectsProps extends BaseSSRType {
    projectList: Project[]
    paasToken: string
}

export default function Projects(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    if (typeof window === 'undefined') {
        return (<></>)
    }
    const { projectList, userInfo } = props
    setUserInfo(userInfo)

    // NOTE: Delete PaaS reset token in 2026 since no one's using it.
    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size='large'>
                <ProjectTable projectList={projectList} />
            </Space>
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ProjectsProps> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const user = (await client.getWhoami()).data
    const data = (await client.getProjects()).data
    return {
        props: {
            userInfo: userInfo,
            projectList: data,
            paasToken: user.paasToken,
        },
    }
}