import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { SubmitExperimentWorkflowForm } from "../../../lib/components/experiments/SubmitExperimentWorkflowForm"
import { ExperimentWorkflowConfiguration } from "../../../lib/models/workflow"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
    workflowConfigurationResp: ExperimentWorkflowConfigurationResponse
}

export default function SubmitWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo, workflowConfigurationResp } = props
    setUserInfo(userInfo)

    const wfConfig: ExperimentWorkflowConfiguration = JSON.parse(workflowConfigurationResp.configuration)

    return (
        <>
            <SubmitExperimentWorkflowForm
                experiment={experiment}
                resourcePool={workflowConfigurationResp.resourcePool}
                wfConfig={wfConfig}
            />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const experimentId = Number(ctx.query.id)
    const experiment = (await client.getExperimentExperimentId(experimentId)).data
    const workflowConfigurationResp = (await client.getExperimentExperimentIdWorkflowConfiguration(experimentId)).data
    return {
        props: {
            userInfo: userInfo,
            experiment: experiment,
            workflowConfigurationResp: workflowConfigurationResp,
        },
    }
}