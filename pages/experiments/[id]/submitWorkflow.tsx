import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse, Project } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { Card } from "antd"
import { WorkflowDescription } from "../../../lib/components/experiments/WorkflowDescription"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
    project?: Project
}

export default function SubmitWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo, project } = props
    setUserInfo(userInfo)
    const wfConfResp = experiment.workflowExperimentConfiguration

    return (
        <>
            <Card title="PaaS工作流" bordered={false}>
                {wfConfResp && project &&
                    <WorkflowDescription
                        experiment={experiment}
                        wfConfResp={wfConfResp}
                        project={project}
                    />
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