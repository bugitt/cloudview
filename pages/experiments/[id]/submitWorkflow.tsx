import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse, Project, SimpleEntity } from "../../../lib/cloudapi-client"
import { cloudapiClient, serverSideCloudapiClient, viewApiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { Card, Spin, Tabs } from "antd"
import { WorkflowDescription } from "../../../lib/components/experiments/WorkflowDescription"
import { useRequest } from "ahooks"
import { notificationError } from "../../../lib/utils/notification"
import { useState } from "react"
import { ExperimentWorkflowStudent } from "../../../lib/components/experiments/ExperimentWorkflowStudent"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
    project?: Project
}

export default function SubmitWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo, project } = props
    setUserInfo(userInfo)
    const [expWfConfigList, setExpWfConfigList] = useState<SimpleEntity[]>([])
    const expWfListReq = useRequest(() => cloudapiClient.getExperimentExperimentIdSimpleWorkflowConfiguration(experiment.id), {
        onSuccess: (resp) => {
            setExpWfConfigList(resp.data)
        },
        onError: () => {
            notificationError("获取该实验工作流列表失败")
        },
    })
    return (
        <>
            <Spin spinning={expWfListReq.loading}>
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
            </Spin>
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