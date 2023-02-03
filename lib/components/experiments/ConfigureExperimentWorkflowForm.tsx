import { ProFormInstance, ProForm, ProFormCheckbox, ProFormSelect, ProFormText, ProFormGroup, ProFormDigit, ProFormList, ProFormSwitch } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { useState, useRef, useEffect } from "react"
import { ExperimentResponse, ExperimentWorkflowConfigurationRequest } from "../../cloudapi-client"
import { ExperimentWorkflowConfiguration, SubmitType } from "../../models/workflow"
import { cloudapiClient, viewApiClient } from "../../utils/cloudapi"
import { messageInfo, notificationError } from "../../utils/notification"

interface Props {
    experiment: ExperimentResponse
    mode: "create" | "update" | "view"
    onSuccessHook: () => void
    onFailedHook: () => void
}

interface FormDataType {
    submitOptions: SubmitType[]
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
    allowCustomBaseImage: boolean
    allowCustomCompileCommand: boolean
    allowCustomDeployCommand: boolean
    allowCustomPorts: boolean
}

export function ConfigureExperimentWorkflowForm(props: Props) {
    const { experiment, onSuccessHook, onFailedHook, mode } = props
    const [baseImage, setBaseImage] = useState<string>("")

    const { data: workflowTemplates } = useRequest(() => viewApiClient.getWorkflowTemplates())

    const formRef = useRef<ProFormInstance>()

    const onFinish = async (values: FormDataType) => {
        const finalBaseImage = values.baseImage ?? baseImage
        if (!finalBaseImage) {
            notificationError("请填写基础镜像")
            return false
        }
        const configuration: ExperimentWorkflowConfiguration = {
            experimentId: experiment.id,
            submitOptions: values.submitOptions,
            resource: {
                cpu: values.cpu,
                memory: values.memory,
            },
            workflowTemplateName: values.baseEnv,
            baseImage: finalBaseImage,
            buildSpec: values.compileCommand ? {
                command: values.compileCommand,
            } : undefined,
            deploySpec: {
                changeEnv: false,
                command: values.deployCommand,
                ports: values.ports?.map((port) => {
                    return {
                        export: true,
                        port: parseInt(port.port),
                        protocol: port.protocol.toLowerCase() as ('tcp' | 'udp' | 'sctp'),
                    }
                }),
            },
            customOptions: {
                baseImage: values.allowCustomBaseImage,
                compileCommand: values.allowCustomCompileCommand,
                deployCommand: values.allowCustomDeployCommand,
                ports: values.allowCustomPorts,
            }
        }
        const req: ExperimentWorkflowConfigurationRequest = {
            expId: experiment.id,
            resource: configuration.resource,
            configuration: JSON.stringify(configuration),
        }
        try {
            await cloudapiClient.postExperimentExperimentIdWorkflowConfiguration(experiment.id, req)
            onSuccessHook()
            messageInfo("配置PaaS工作流成功")
            return true
        } catch (e) {
            notificationError("配置PaaS工作流失败")
            onFailedHook()
            return false
        }
    }

    useEffect(() => {
        if (mode === "view") {
            const wfConfigJson = experiment.workflowExperimentConfiguration!!
            const wfConfig = JSON.parse(wfConfigJson.configuration) as ExperimentWorkflowConfiguration
            setBaseImage(wfConfig.baseImage)

            formRef.current?.setFieldsValue({
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
        }
    }, [mode, experiment])

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
                <ProFormCheckbox.Group
                    name="submitOptions"
                    label="作业提交方式"
                    options={[
                        {
                            label: "使用压缩包提交",
                            value: "zip",
                        },
                        {
                            label: "使用 Git 提交",
                            value: "git",
                        }
                    ]}
                    initialValue={["zip"]}
                    rules={[
                        {
                            required: true,
                            message: "请选择作业提交方式",
                        },
                    ]}
                />

                <ProFormSelect
                    name="baseEnv"
                    label="基础环境"
                    valueEnum={(new Map(workflowTemplates?.map((template) => [template.name, template.name]) ?? [])).set("custom", "自定义")}
                    fieldProps={{
                        onChange: (value) => {
                            const template = workflowTemplates?.find((template) => template.name === value)
                            setBaseImage(template?.baseImage ?? "")
                            formRef.current?.setFieldsValue({
                                baseImage: template?.baseImage,
                                cpu: template?.resource.cpu,
                                memory: template?.resource.memory,
                                compileCommand: template?.buildSpec?.command,
                                deployCommand: template?.deploySpec?.command,
                                ports: template?.deploySpec?.ports,
                            })
                        }
                    }}
                    tooltip={"请选择编译和运行所提交的源代码所需要使用的基础环境。"}
                    extra={baseImage && baseImage !== '' ? `当前使用的镜像为 ${baseImage}。` : ''}
                    showSearch
                />

                <ProFormText
                    name={"baseImage"}
                    label="自定义基础镜像"
                    tooltip={"请给出编译和运行所提交的源代码所需要使用的基础镜像。"}
                />

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

                <ProFormGroup title="请配置学生可自定义的选项">
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
                </ProFormGroup>

            </ProForm>
        </>
    )
}