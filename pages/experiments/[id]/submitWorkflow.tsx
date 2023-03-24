import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse, Project } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { Alert, Space, Tabs, Typography } from "antd"
import { useEffect } from "react"
import { ExperimentWorkflowStudent } from "../../../lib/components/experiments/ExperimentWorkflowStudent"
import { useExpWfConfRespListStore } from "../../../lib/components/workflow/experimentWorkflowConfigurationStateManagement"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
    project?: Project
}

export default function SubmitWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo, project } = props
    setUserInfo(userInfo)
    const expWfConfigList = useExpWfConfRespListStore().expWfConfRespList
    const refresh = useExpWfConfRespListStore().refresh
    useEffect(() => {
        refresh(experiment.id)
    }, [experiment, refresh])
    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size='large'>
                <Alert
                    message={
                        <Typography>
                            请访问 <Typography.Link href='https://scs.buaa.edu.cn/doc/01_common/expreiment_paas/' target='_blank'>文档</Typography.Link> 来了解我们新推出的课程实验PaaS工作流功能！
                        </Typography>
                    }
                    type='info'
                    closable
                />
                <Tabs
                    defaultActiveKey="1"
                    items={expWfConfigList.map((wfConfig, index) => {
                        return {
                            key: String(index + 1),
                            label: wfConfig.name,
                            children: (
                                project ? <ExperimentWorkflowStudent
                                    key={index}
                                    experiment={experiment}
                                    projectName={project?.name}
                                    simpleWfConfig={wfConfig}
                                /> : <></>
                            )
                        }
                    })}
                />
            </Space>
        </>
    )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const experimentId = Number(ctx.query.id)
    const experiment = (await client.getExperimentExperimentId(experimentId, true)).data
    let project: Project | undefined = undefined
    try {
        project = (await client.getProjects(experimentId)).data[0]
    } catch (_) {
        // ignore
    }

    return {
        props: {
            userInfo: userInfo,
            experiment: experiment,
            project: project,
        },
    }
}