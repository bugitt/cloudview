import { Space, Alert, Typography } from "antd"
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
    if (typeof window === 'undefined') {
        return (<></>)
    }
    const { projectList, userInfo } = props
    setUserInfo(userInfo)
    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size='large'>
                <Alert
                    message={
                        <Typography>
                            请访问 <Typography.Link href='https://scs.buaa.edu.cn/doc/01_common/paas/' target='_blank'>文档</Typography.Link> 来了解我们新推出的PaaS工作流功能！
                        </Typography>
                    }
                    type='info'
                    closable
                />
                <ProjectTable projectList={projectList} />
            </Space>
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