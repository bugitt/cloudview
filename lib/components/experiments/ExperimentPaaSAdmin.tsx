import { useRequest } from "ahooks";
import { Card, Button, Drawer, Tabs, Spin } from "antd";
import { useState } from "react";
import { ExperimentResponse, SimpleEntity } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { notificationError } from "../../utils/notification";
import { ConfigureExperimentWorkflowForm } from "./ConfigureExperimentWorkflowForm";
import { ExperimentWorkflowAdmin } from "./ExperimentWorkflowAdmin";

interface Props {
    experiment: ExperimentResponse
}

export function ExperimentPaaSAdmin(props: Props) {
    const { experiment } = props
    const [configFormDrawerOpen, setConfigFormDrawerOpen] = useState(false)
    const [expWfConfigList, setExpWfConfigList] = useState<SimpleEntity[]>([])
    const expWfListReq = useRequest(() => cloudapiClient.getExperimentExperimentIdSimpleWorkflowConfiguration(experiment.id), {
        onSuccess: (resp) => {
            setExpWfConfigList(resp.data)
        },
        onError: () => {
            notificationError("获取实验工作流配置列表失败")
        },
    })
    return (
        <>
            <Card title="PaaS工作流" bordered={false}
                extra={(
                    <>
                        <Button type="primary" onClick={() => {
                            setConfigFormDrawerOpen(true)
                        }}>添加新的工作流配置</Button>
                    </>
                )}
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
                            expWfListReq.run()
                            setConfigFormDrawerOpen(false)
                        }}
                        onFailedHook={() => {
                            expWfListReq.run()
                            setConfigFormDrawerOpen(true)
                        }}
                    />
                </Drawer>

                <Spin spinning={expWfListReq.loading}>
                    <Tabs
                        defaultActiveKey="1"
                        items={expWfConfigList.map((wfConfig, index) => {
                            return {
                                key: String(index + 1),
                                label: wfConfig.name,
                                children: (
                                    <ExperimentWorkflowAdmin
                                        key={index}
                                        experiment={experiment}
                                        simpleWfConfig={wfConfig}
                                    />
                                )
                            }
                        })}
                    />
                </Spin>
            </Card>
        </>
    )
}