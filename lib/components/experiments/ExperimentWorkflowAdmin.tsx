import { useRequest } from "ahooks";
import { Button, Collapse, Space, Spin } from "antd";
import { ExperimentResponse, SimpleEntity } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { ConfigureExperimentWorkflowForm } from "./ConfigureExperimentWorkflowForm";
import { DeleteExperimentWorkflowConfigurationButton } from "./DeleteExperimentWorkflowConfigurationButton";
import { ExperimentWorkflowTable } from "./ExperimentWorkflowTable";

interface Props {
    experiment: ExperimentResponse
    simpleWfConfig: SimpleEntity
}

export function ExperimentWorkflowAdmin(props: Props) {
    const { experiment, simpleWfConfig } = props
    const { data, loading } = useRequest(() => cloudapiClient.getWorkflowConfigurationId(simpleWfConfig.id), {
        refreshDeps: [props],
    })
    return (
        <>
            <Spin spinning={loading || !data}>
                {data && !loading && <>
                    <Collapse>
                        <Collapse.Panel header="工作流配置详情" key="1">
                            <Space direction='vertical' style={{ width: '100%' }}>
                                <DeleteExperimentWorkflowConfigurationButton wfConfigResp={data.data} />
                                <ConfigureExperimentWorkflowForm
                                    experiment={experiment}
                                    mode="view"
                                    wfConfigResp={data.data}
                                    onSuccessHook={() => { }}
                                    onFailedHook={() => { }}
                                />
                            </Space>
                        </Collapse.Panel>
                    </Collapse>
                    <ExperimentWorkflowTable
                        experiment={experiment}
                        wfConfigResp={data.data}
                    />
                </>}
            </Spin>
        </>
    )
}