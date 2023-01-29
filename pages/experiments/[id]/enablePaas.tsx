import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { ConfigureExperimentWorkflowForm } from "../../../lib/components/experiments/ConfigureExperimentWorkflowForm"

interface ExperimentProps extends BaseSSRType {
    experiment: ExperimentResponse
}

export default function EnablePaasForm(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo } = props
    setUserInfo(userInfo)

    return (
        <>
            <ConfigureExperimentWorkflowForm experiment={experiment} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ExperimentProps> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const loginUser = (await client.getWhoami()).data
    const experimentId = Number(ctx.query.id)
    const experiment = (await client.getExperimentExperimentId(experimentId)).data
    if (loginUser.adminCourses.findIndex((course) => course.id === experiment.course.id) === -1) {
        ctx.res.statusCode = 403
        throw new Error("You are not allowed to access this page")
    }
    return {
        props: {
            userInfo: userInfo,
            experiment: experiment,
        },
    }
}