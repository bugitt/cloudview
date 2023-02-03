import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse, Project } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient, viewApiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { Card, Spin } from "antd"
import { WorkflowDescription } from "../../../lib/components/experiments/workflowDescription"
import { Workflow } from "../../../lib/models/workflow"
import { useState } from "react"
import { useRequest } from "ahooks"
import { notificationError } from "../../../lib/utils/notification"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
    project?: Project
}

export default function SubmitWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo } = props
    setUserInfo(userInfo)

    const wfConfResp = experiment.workflowExperimentConfiguration
    const [workflow, setWorkflow] = useState<Workflow>()
    const { loading: workflowLoading } = useRequest(() => {
        const project = props.project
        return project ?
            viewApiClient.listWorkflows(project.name).then(workflows => workflows[0])
            : Promise.resolve(undefined)
    }, {
        onSuccess: (workflow) => {
            setWorkflow(workflow)
        },
        onError: (_) => {
            notificationError("获取PaaS工作流失败")
        }
    })

    return (
        <>
            <Card title="PaaS工作流" bordered={false}>
                {wfConfResp && workflow &&
                    <Spin spinning={workflowLoading}>
                        <WorkflowDescription
                            experiment={experiment}
                            wfConfResp={wfConfResp}
                            workflow={workflow}
                        />
                    </Spin>
                }
            </Card>
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