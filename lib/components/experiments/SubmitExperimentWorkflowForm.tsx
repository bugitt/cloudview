import { ModalForm, ProFormInstance, ProFormRadio } from "@ant-design/pro-components"
import { Button } from "antd"
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
            <ModalForm
                name="submitExperimentWorkflow"
                onFinish={onFinish}
                formRef={formRef}
                trigger={(<Button type='primary'>提交新的任务</Button>)}
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


            </ModalForm>
        </>
    )
}