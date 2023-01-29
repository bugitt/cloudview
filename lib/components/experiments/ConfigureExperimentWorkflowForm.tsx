import { ProFormInstance, ProForm, ProFormCheckbox, ProFormSelect, ProFormText, ProFormGroup, ProFormDigit, ProFormList, ProFormSwitch } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { useState, useRef } from "react"
import { ExperimentResponse } from "../../cloudapi-client"
import { WorkflowTemplate } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"

interface Props {
    experiment: ExperimentResponse
}

export function ConfigureExperimentWorkflowForm(props: Props) {
    const { experiment } = props

    const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplate | undefined>(undefined)

    const [customBaseImage, setCustomBaseImage] = useState<boolean>(false)
    const [baseImage, setBaseImage] = useState<string>("")

    const { data: workflowTemplates } = useRequest(() => viewApiClient.getWorkflowTemplates())

    const formRef = useRef<ProFormInstance>()

    const onFinish = async (values: any) => {
        console.log(values.submitOptions)
    }

    return (
        <>
            <ProForm
                name="enablePassForm"
                onFinish={onFinish}
                formRef={formRef}
                layout="vertical"
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
                            if (value === 'custom') {
                                setCustomBaseImage(true)
                            } else {
                                setCustomBaseImage(false)
                            }
                            const template = workflowTemplates?.find((template) => template.name === value)
                            setWorkflowTemplate(workflowTemplates?.find((template) => template.name === value))
                            setBaseImage(template?.buildSpec?.baseImage ?? "")
                            formRef.current?.setFieldsValue({
                                baseImage: template?.buildSpec?.baseImage,
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

                {
                    customBaseImage && <>
                        <ProFormText
                            name={"baseImage"}
                            label="自定义基础镜像"
                            tooltip={"请给出编译和运行所提交的源代码所需要使用的基础镜像。"}
                        />
                    </>

                }

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