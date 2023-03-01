import { useRequest } from "ahooks";
import { Collapse, Spin } from "antd";
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse, SimpleEntity, UserModel } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { ConfigureExperimentWorkflowForm } from "./ConfigureExperimentWorkflowForm";
import { ExperimentWorkflowTable } from "./ExperimentWorkflowTable";

interface Props {
    experiment: ExperimentResponse
    simpleWfConfig: SimpleEntity
}

export function ExperimentWorkflowAdmin(props: Props) {
    const { experiment, simpleWfConfig } = props
    const { data, loading } = useRequest(() => cloudapiClient.getWorkflowConfigurationId(simpleWfConfig.id), {
        refreshDeps: [props]
    })
    return (
        <>
            <Spin spinning={loading || !data}>
                <Collapse>
                    <Collapse.Panel header="工作流配置详情" key="1">
                        <ConfigureExperimentWorkflowForm
                            experiment={experiment}
                            mode="view"
                            wfConfigResp={data?.data}
                            onSuccessHook={() => { }}
                            onFailedHook={() => { }}
                        />
                    </Collapse.Panel>
                </Collapse>
                <ExperimentWorkflowTable
                    experiment={experiment}
                    tag='submit'
                    studentList={data?.data.studentList ?? []}
                />
            </Spin>
        </>
    )
}