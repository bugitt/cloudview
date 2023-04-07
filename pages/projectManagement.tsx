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
    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size='large'>
                <ProDescriptions>
                    <ProDescriptions.Item label='PaaS平台通用密码' span={3}>
                        <Button onClick={() => {
                            copyToClipboard(props.paasToken, 'PaaS平台通用密码')
                        }}>点击复制</Button>
                    </ProDescriptions.Item>
                    <ProDescriptions.Item label='重置PaaS平台通用密码' span={3}>
                        <ResetPaaSTokenButton />
                    </ProDescriptions.Item>
                </ProDescriptions>
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