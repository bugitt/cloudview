import { ProList } from "@ant-design/pro-components"
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from "../../cloudapi-client"
import { ExperimentWorkflowConfiguration } from "../../models/workflow"
import { SubmitExperimentWorkflowForm } from "./SubmitExperimentWorkflowForm"

interface Props {
    experiment: ExperimentResponse
    wfConfResp: ExperimentWorkflowConfigurationResponse
}

export function SingleStudentWorkflowTaskList(props: Props) {
    const { experiment, wfConfResp } = props
    return (
        <>
            <ProList<any>
                toolBarRender={() => {
                    return [
                        <SubmitExperimentWorkflowForm
                            experiment={experiment}
                            resourcePool={wfConfResp.resourcePool}
                            wfConfig={JSON.parse(wfConfResp.configuration) as ExperimentWorkflowConfiguration}
                            key="submit"
                        />
                    ];
                }}
                onRow={(record: any) => {
                    return {
                        onMouseEnter: () => {
                            console.log(record);
                        },
                        onClick: () => {
                            console.log(record);
                        },
                    };
                }}
                rowKey="id"
                headerTitle="任务列表"
                dataSource={[{ id: 1 }]}
                showActions="hover"
                showExtra="hover"
            />
        </>
    )
}