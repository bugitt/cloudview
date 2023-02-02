import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { SingleStudentWorkflowTaskList } from "../../../lib/components/experiments/SingleStudentWorkflowTaskList"
import { Card } from "antd"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
}

export default function SubmitWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo } = props
    setUserInfo(userInfo)

    const wfConfResp = experiment.workflowExperimentConfiguration

    return (
        <>
            <Card title="PaaS工作流" bordered={false}>
                {wfConfResp &&
                    <SingleStudentWorkflowTaskList
                        experiment={experiment}
                        wfConfResp={wfConfResp}
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

    return {
        props: {
            userInfo: userInfo,
            experiment: experiment,
        },
    }
}