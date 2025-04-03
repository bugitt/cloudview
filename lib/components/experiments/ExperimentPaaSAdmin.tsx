import { useRequest } from "ahooks";
import { Card, Button, Drawer, Tabs, Spin } from "antd";
import { useEffect, useState } from "react";
import { ExperimentResponse, SimpleEntity } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { notificationError } from "../../utils/notification";
import { useExpWfConfRespListStore } from "../workflow/experimentWorkflowConfigurationStateManagement";
import { ConfigureExperimentWorkflowForm } from "./ConfigureExperimentWorkflowForm";
import { ExperimentWorkflowAdmin } from "./ExperimentWorkflowAdmin";

interface Props {
    experiment: ExperimentResponse
}

export function ExperimentPaaSAdmin(props: Props) {
    const { experiment } = props
    const [configFormDrawerOpen, setConfigFormDrawerOpen] = useState(false)
    const expWfConfigList = useExpWfConfRespListStore().expWfConfRespList
    const refresh = useExpWfConfRespListStore().refresh
    useEffect(() => {
        refresh(props.experiment.id)
    }, [props.experiment, refresh])
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
                    title="配置新的PaaS工作流"
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
                            refresh(experiment.id)
                            setConfigFormDrawerOpen(false)
                        }}
                        onFailedHook={() => {
                            refresh(experiment.id)
                            setConfigFormDrawerOpen(true)
                        }}
                    />
                </Drawer>

                <Tabs
                    defaultActiveKey="1"
                    items={expWfConfigList.map((wfConfig: any, index: number) => {
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
            </Card>
        </>
    )
}