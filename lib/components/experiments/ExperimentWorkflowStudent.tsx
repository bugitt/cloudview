import { useRequest } from "ahooks";
import { Spin } from "antd";
import { useState } from "react";
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse, SimpleEntity } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { WorkflowDescription } from "./WorkflowDescription";

interface Props {
    experiment: ExperimentResponse
    simpleWfConfig: SimpleEntity
    projectName: string
}

export function ExperimentWorkflowStudent(props: Props) {
    const { experiment, simpleWfConfig, projectName } = props
    const [wfConfigResp, setWfConfigResp] = useState<ExperimentWorkflowConfigurationResponse>()
    const req = useRequest(() => cloudapiClient.getWorkflowConfigurationId(simpleWfConfig.id), {
        refreshDeps: [props],
        onSuccess: (data) => {
            setWfConfigResp(data.data)
        }
    })
    return (
        <>
            <Spin spinning={req.loading}>
                {wfConfigResp && <>
                    <WorkflowDescription
                        experiment={experiment}
                        wfConfResp={wfConfigResp}
                        projectName={projectName}
                    />
                </>}
            </Spin>
        </>
    )
}