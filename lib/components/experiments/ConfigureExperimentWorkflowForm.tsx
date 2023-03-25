import { ProFormInstance, ProForm, ProFormCheckbox, ProFormSelect, ProFormText, ProFormGroup, ProFormDigit, ProFormList, ProFormSwitch, ProFormRadio } from "@ant-design/pro-components"
import { notification } from "antd"
import { useState, useRef, useEffect } from "react"
import { ExperimentResponse, ExperimentWorkflowConfigurationRequest, ExperimentWorkflowConfigurationResponse } from "../../cloudapi-client"
import { ExperimentWorkflowConfiguration, adminSetupWorkflow, SubmitType } from "../../models/workflow"
import { cloudapiClient } from "../../utils/cloudapi"
import { messageInfo, notificationError } from "../../utils/notification"
import { useExpWfConfRespListStore } from "../workflow/experimentWorkflowConfigurationStateManagement"
import { workflowTemplates } from "../workflow/workflowTemplates"

interface Props {
    experiment: ExperimentResponse
    mode: "create" | "update" | "view"
    wfConfigResp?: ExperimentWorkflowConfigurationResponse
    onSuccessHook: () => void
    onFailedHook: () => void
}

interface FormDataType {
    needSubmit: boolean
    submitOptions?: SubmitType[]
    baseEnv: string
    baseImage?: string
    cpu: number
    memory: number
    compileCommand?: string
    deployCommand?: string
    ports?: {
        port: string
        protocol: string
    }[]
    setupNow: boolean
    allowCustomBaseImage?: boolean
    allowCustomCompileCommand?: boolean
    allowCustomDeployCommand?: boolean
    allowCustomPorts?: boolean
}

const getWorkflowTemplateByName = (name?: string) => {
    return workflowTemplates.find((template) => template.name === name)
}

export function ConfigureExperimentWorkflowForm(props: Props) {
    const disableChosenSubmit = useExpWfConfRespListStore().hasSubmitType
    const { experiment, onSuccessHook, onFailedHook, mode } = props
    const [baseImage, setBaseImage] = useState<string>()
    const [extraFields, setExtraFields] = useState<React.ReactNode>(<></>)
    const [needSubmit, setNeedSubmit] = useState<boolean | undefined>(disableChosenSubmit ? false : undefined)

    const formRef = useRef<ProFormInstance>()

    const onFinish = async (values: any) => {
        const typedValues = values as FormDataType
        const finalBaseImage = typedValues.baseImage ?? baseImage
        let configuration: ExperimentWorkflowConfiguration = {
            experimentId: experiment.id,
            submitOptions: typedValues.submitOptions ?? [],
            resource: {
                cpu: typedValues.cpu,
                memory: typedValues.memory,
            },
            workflowTemplateName: typedValues.baseEnv,
            baseImage: finalBaseImage,
            buildSpec: typedValues.compileCommand ? {
                command: typedValues.compileCommand,
            } : undefined,
            deploySpec: {
                changeEnv: false,
                command: typedValues.deployCommand,
                ports: typedValues.ports?.map((port) => {
                    return {
                        export: true,
                        port: parseInt(port.port),
                        protocol: port.protocol.toLowerCase() as ('tcp' | 'udp' | 'sctp'),
                    }
                }),
            },
            customOptions: {
                baseImage: typedValues.allowCustomBaseImage ?? false,
                compileCommand: typedValues.allowCustomCompileCommand ?? false,
                deployCommand: typedValues.allowCustomDeployCommand ?? false,
                ports: typedValues.allowCustomPorts ?? false,
            }
        }

        const template = getWorkflowTemplateByName(typedValues.baseEnv)
        if (template) {
            configuration = template.decorateConfiguration?.(configuration, values) ?? configuration
        }

        const req: ExperimentWorkflowConfigurationRequest = {
            needSubmit: typedValues.needSubmit,
            expId: experiment.id,
            resource: configuration.resource,
            configuration: JSON.stringify(configuration),
            name: values.name ? values.name as string : '作业提交与部署',
        }
        try {
            const wfConfigResp = (await cloudapiClient.postExperimentExperimentIdWorkflowConfiguration(experiment.id, req)).data
            onSuccessHook()
            messageInfo("配置PaaS工作流成功")
            if (typedValues.setupNow) {
                notification['info']({
                    message: '正在为每位学生部署工作流，请稍等……'
                })
                adminSetupWorkflow(wfConfigResp, experiment.id, wfConfigResp.studentList.map((s) => s.id))
                // notification['success']({
                //     message: '工作流部署完成'
                // })
            }
            return true
        } catch (e) {
            notificationError("配置PaaS工作流失败")
            onFailedHook()
            return false
        }
    }

    useEffect(() => {
        if (mode === "view") {
            const wfConfigResp = props.wfConfigResp!
            const wfConfig = JSON.parse(wfConfigResp.configuration) as ExperimentWorkflowConfiguration
            setBaseImage(wfConfig.baseImage)

            formRef.current?.setFieldsValue({
                needSubmit: wfConfigResp.needSubmit ?? true,
                submitOptions: wfConfig.submitOptions,
                cpu: wfConfig.resource.cpu,
                memory: wfConfig.resource.memory,
                baseEnv: wfConfig.workflowTemplateName,
                baseImage: wfConfig.baseImage,
                compileCommand: wfConfig.buildSpec?.command,
                deployCommand: wfConfig.deploySpec.command,
                ports: wfConfig.deploySpec.ports,
                allowCustomBaseImage: wfConfig.customOptions.baseImage,
                allowCustomCompileCommand: wfConfig.customOptions.compileCommand,
                allowCustomDeployCommand: wfConfig.customOptions.deployCommand,
                allowCustomPorts: wfConfig.customOptions.ports,
            })

            const template = getWorkflowTemplateByName(wfConfig.workflowTemplateName)
            if (template) {
                if (template.setFormFields) {
                    template.setFormFields(wfConfig, formRef)
                }
                if (template.extraFormItems) {
                    setExtraFields(template.extraFormItems)
                }
            }
        }

        if (disableChosenSubmit) {
            formRef.current?.setFieldsValue({
                needSubmit: false,
            })
        }
    }, [mode, props, disableChosenSubmit])

    return (
        <>
            <ProForm<FormDataType>
                name="configureExperimentWorkflow"
                onFinish={onFinish}
                formRef={formRef}
                layout="vertical"
                submitter={mode === 'view' ? false : undefined}
                disabled={props.mode === "view"}
            >

                <ProFormRadio.Group
                    name="needSubmit"
                    label="工作流类型"
                    options={[
                        {
                            label: "作业提交与展示",
                            value: true,
                        },
                        {
                            label: "辅助实验环境",
                            value: false,
                        }
                    ]}
                    fieldProps={{
                        onChange: (e) => {
                            setNeedSubmit(e.target.value)
                        }
                    }}
                    required
                    disabled={disableChosenSubmit}
                />

                {
                    needSubmit !== undefined && !needSubmit && <ProFormSwitch
                        name="setupNow"
                        label="是否立即部署"
                        checkedChildren="是"
                        unCheckedChildren="否"
                        initialValue={true}
                    />
                }

                {
                    needSubmit !== undefined && !needSubmit && (
                        <ProFormText
                            name="name"
                            label="工作流名称"
                            required
                        />
                    )
                }

                {needSubmit !== undefined && needSubmit && <ProFormCheckbox.Group
                    name="submitOptions"
                    label="作业提交方式"
                    options={[
                        {
                            label: "使用压缩包提交",
                            value: "zip",
                        },
                        // {
                        //     label: "使用 Git 提交",
                        //     value: "git",
                        // }
                    ]}
                    initialValue={["zip"]}
                    rules={[
                        {
                            required: true,
                            message: "请选择作业提交方式",
                        },
                    ]}
                />}

                <ProFormSelect
                    name="baseEnv"
                    label="基础环境"
                    valueEnum={(new Map(workflowTemplates?.map((template) => [template.name, template.name]) ?? [])).set("custom", "自定义")}
                    fieldProps={{
                        onChange: (value) => {
                            const template = getWorkflowTemplateByName(value as string)
                            setBaseImage(template?.baseImage ?? "")
                            formRef.current?.setFieldsValue({
                                baseImage: template?.baseImage,
                                cpu: template?.resource.cpu,
                                memory: template?.resource.memory,
                                compileCommand: template?.buildSpec?.command,
                                deployCommand: template?.deploySpec?.command,
                                ports: template?.deploySpec?.ports,
                            })
                            setExtraFields(template?.extraFormItems ?? <></>)
                        }
                    }}
                    tooltip={"请选择编译和运行所提交的源代码所需要使用的基础环境。"}
                    extra={baseImage && baseImage !== '' ? `当前使用的镜像为 ${baseImage}。` : ''}
                    showSearch
                    required
                />

                <ProFormText
                    name={"baseImage"}
                    label="自定义基础镜像"
                    tooltip={"请给出编译和运行所提交的源代码所需要使用的基础镜像。"}
                />

                {extraFields}

                <ProFormGroup title="资源限额">
                    <ProFormDigit
                        name="cpu"
                        label="CPU限额"
                        min={1}
                        addonAfter="mCore"
                        extra="1 核 = 1000 mCore"
                        rules={[{ required: true }]}
                    />
                    <ProFormDigit
                        name="memory"
                        label="内存限额"
                        min={1}
                        addonAfter="MB"
                        rules={[{ required: true }]}
                    />
                </ProFormGroup>

                <ProFormText
                    name={"compileCommand"}
                    label="编译命令"
                    tooltip={"请给出编译所提交的源代码所需要使用的编译命令。如果命令较复杂，建议在提交的作业中提供编译脚本，并在此直接填写编译脚本的执行命令。\n请注意，该编译命令将会在所提交作业（压缩包或Git仓库）的根目录执行。"}
                    extra="请注意，该编译命令将会在所提交作业（压缩包或Git仓库）的根目录执行。"
                />

                <ProFormText
                    name={"deployCommand"}
                    label="启动命令"
                    tooltip="请给出部署时所使用的命令。如果没有给出，将使用默认基础镜像的默认启动命令。"
                />

                <ProFormList
                    name="ports"
                    label="端口信息"
                    copyIconProps={false}
                    creatorButtonProps={{
                        creatorButtonText: '添加需要对外暴露的端口'
                    }}
                    deleteIconProps={{
                        tooltipText: '删除'
                    }}
                >
                    <ProFormGroup key="portGroup">
                        <ProFormText
                            name="port"
                            label="端口号"
                            extra="各个端口号互相之间不能重复"
                            placeholder="请输入端口号"
                            rules={[
                                { required: true },
                                {
                                    type: 'number',
                                    validator: (_, value) => {
                                        if (value < 1 || value > 65535) {
                                            return Promise.reject(
                                                '端口号必须在1-65535之间'
                                            )
                                        }
                                        return Promise.resolve()
                                    },
                                    message: '端口号必须在1-65535之间'
                                }
                            ]}
                        />
                        <ProFormSelect
                            name="protocol"
                            label="协议"
                            valueEnum={{
                                TCP: 'TCP',
                                UDP: 'UDP',
                                SCTP: 'SCTP'
                            }}
                            placeholder="请选择网络协议类型"
                            rules={[
                                {
                                    required: true,
                                    message: '必须选择端口的协议类型'
                                }
                            ]}
                        />
                    </ProFormGroup>
                </ProFormList>

                {needSubmit && <ProFormGroup title="请配置学生可自定义的选项">
                    <ProFormSwitch
                        name="allowCustomBaseImage"
                        label="是否允许学生自定义基础镜像"
                        checkedChildren="是"
                        unCheckedChildren="否"
                        initialValue={false}
                        required
                    />
                    <ProFormSwitch
                        name="allowCustomCompileCommand"
                        label="是否允许学生自定义编译命令"
                        checkedChildren="是"
                        unCheckedChildren="否"
                        initialValue={false}
                        required
                    />
                    <ProFormSwitch
                        name="allowCustomDeployCommand"
                        label="是否允许学生自定义运行/启动命令"
                        checkedChildren="是"
                        unCheckedChildren="否"
                        initialValue={false}
                        required
                    />
                    <ProFormSwitch
                        name="allowCustomPorts"
                        label="是否允许学生自定义端口信息"
                        checkedChildren="是"
                        unCheckedChildren="否"
                        initialValue={false}
                        required
                    />
                </ProFormGroup>}

            </ProForm>
        </>
    )
}