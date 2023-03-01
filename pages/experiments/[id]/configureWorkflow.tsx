import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { ExperimentPaaSAdmin } from "../../../lib/components/experiments/ExperimentPaaSAdmin"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
}

export default function ConfigureWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    setUserInfo(props.userInfo)

    if (typeof window === 'undefined') {
        return <></>
    }

    return (
        <>
            <ExperimentPaaSAdmin experiment={props.experiment} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const loginUser = (await client.getWhoami()).data
    const experimentId = Number(ctx.query.id)
    const experiment = (await client.getExperimentExperimentId(experimentId, true)).data
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