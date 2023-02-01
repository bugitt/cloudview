import { ProForm, ProFormInstance, ProFormRadio } from "@ant-design/pro-components"
import { useRef, useState } from "react"
import { ExperimentResponse } from "../../cloudapi-client"
import { displaySubmitType, ExperimentWorkflowConfiguration, SubmitType } from "../../models/workflow"

interface Props {
    experiment: ExperimentResponse
    resourcePool: string    // name of resource pool
    wfConfig: ExperimentWorkflowConfiguration
}

export function SubmitExperimentWorkflowForm(props: Props) {
    const { experiment, resourcePool, wfConfig } = props

    const onFinish = async (values: any) => {
        console.log(values)
    }
    const formRef = useRef<ProFormInstance>()

    const [submitType, setSubmitType] = useState<SubmitType | undefined>(undefined)

    return (
        <>
            <ProForm
                name="submitExperimentWorkflow"
                onFinish={onFinish}
                formRef={formRef}
                layout="vertical"
            >
                <ProFormRadio.Group
                    name="submitType"
                    label="提交方式"
                    options={wfConfig.submitOptions.map((submitType) => {
                        return { label: displaySubmitType(submitType), value: submitType }
                    })}
                    fieldProps={{
                        onChange: (e) => {
                            setSubmitType(e.target.value)
                        }
                    }}
                />


            </ProForm>
        </>
    )
}