import { useRequest } from "ahooks";
import { Collapse, Spin } from "antd";
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse, SimpleEntity } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { ConfigureExperimentWorkflowForm } from "./ConfigureExperimentWorkflowForm";
import { ExperimentWorkflowTable } from "./ExperimentWorkflowTable";

interface Props {
    experiment: ExperimentResponse
    simpleWfConfig: SimpleEntity
}

function getTag(wfConfigResp: ExperimentWorkflowConfigurationResponse) {
    return wfConfigResp.needSubmit ? 'submit' : String(wfConfigResp.id)
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
                            <ConfigureExperimentWorkflowForm
                                experiment={experiment}
                                mode="view"
                                wfConfigResp={data.data}
                                onSuccessHook={() => { }}
                                onFailedHook={() => { }}
                            />
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