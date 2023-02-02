import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from "../../../lib/cloudapi-client"
import { cloudapiClient, serverSideCloudapiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { ConfigureExperimentWorkflowForm } from "../../../lib/components/experiments/ConfigureExperimentWorkflowForm"
import { Card, Drawer, Switch, Tabs, TabsProps } from "antd"
import { useState } from "react"
import { useRequest } from "ahooks"
import { notificationError } from "../../../lib/utils/notification"

interface Props extends BaseSSRType {
    experiment: ExperimentResponse
    expWfResp: ExperimentWorkflowConfigurationResponse | null
}

export default function ConfigureWorkflow(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { expWfResp, userInfo } = props
    const [experiment, setExperiment] = useState(props.experiment)
    const [enablePaasWorkflow, setEnablePaasWorkflow] = useState(!!expWfResp)
    const [configFormDrawerOpen, setConfigFormDrawerOpen] = useState(false)
    const experimentReq = useRequest(() => cloudapiClient.getExperimentExperimentId(props.experiment.id, true), {
        manual: true,
        onSuccess: (resp) => {
            setExperiment(resp.data)
            setEnablePaasWorkflow(!!resp.data.workflowExperimentConfiguration)
        },
        onError: () => {
            notificationError("获取课程实验信息失败")
        }
    })
    setUserInfo(userInfo)

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'PaaS工作流配置',
            children: (<>
                <ConfigureExperimentWorkflowForm
                    experiment={experiment}
                    mode="view"
                    onSuccessHook={() => { }}
                    onFailedHook={() => { }}
                />
            </>),
        },
    ];

    return (
        <>
            <Card title="PaaS工作流" bordered={false}
                extra={(<Switch
                    title="是否开启PaaS工作流"
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                    checked={enablePaasWorkflow}
                    disabled={enablePaasWorkflow}
                    onClick={(checked) => {
                        if (checked) {
                            setConfigFormDrawerOpen(true)
                        }
                    }}
                />)}
            >
                <Drawer
                    title="配置PaaS工作流"
                    placement="right"
                    onClose={() => {
                        setConfigFormDrawerOpen(false)
                    }}
                    open={configFormDrawerOpen}
                    width="50%"
                >
                    <ConfigureExperimentWorkflowForm
                        experiment={experiment}
                        mode="create"
                        onSuccessHook={() => {
                            experimentReq.run()
                            setConfigFormDrawerOpen(false)
                        }}
                        onFailedHook={() => {
                            experimentReq.run()
                            setConfigFormDrawerOpen(true)
                            setEnablePaasWorkflow(false)
                        }}
                    />
                </Drawer>

                {enablePaasWorkflow && <Tabs items={items} />}
            </Card>
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
            expWfResp: experiment.workflowExperimentConfiguration ?? null,
        },
    }
}