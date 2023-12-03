import { ModalForm, ProFormDigit, ProFormGroup, ProFormInstance, ProFormList, ProFormRadio, ProFormSelect, ProFormText, ProFormUploadButton } from "@ant-design/pro-components"
import { Button } from "antd"
import { useEffect, useRef, useState } from "react"
import { ExperimentResponse } from "../../cloudapi-client"
import { CreateWorkflowRequest, displaySubmitType, ExperimentWorkflowConfiguration, SubmitType, UpdateWorkflowRequest, Workflow } from "../../models/workflow"
import { viewApiClient } from "../../utils/cloudapi"
import { AntdUploadResponse } from "../../utils/file"
import { messageSuccess, notificationError } from "../../utils/notification"
import { getToken, getUserId } from "../../utils/token"
import { workflowTemplates } from "../workflow/workflowTemplates"
import { getWorkflowTemplateByName } from "./ConfigureExperimentWorkflowForm"

interface Props {
    experiment: ExperimentResponse
    resourcePool: string    // name of resource pool
    wfConfigRespId: number
    wfConfig: ExperimentWorkflowConfiguration,
    oldWorkflow?: Workflow
}

interface FormDataType {
    submitType: SubmitType
    zipInfo: AntdUploadResponse[]
    gitUrl?: string
    gitRef?: string
    gitUsername?: string
    gitPassword?: string
    baseEnv?: string
    baseImage: string
    compileCommand?: string
    deployCommand?: string
    ports?: {
        port: string
        protocol: string
    }[]
    cpu: number
    memory: number
}

export function SubmitExperimentWorkflowForm(props: Props) {
    const { experiment, resourcePool, wfConfig } = props
    const formRef = useRef<ProFormInstance>()

    const initForm = (wfConfig: ExperimentWorkflowConfiguration) => {
        formRef.current?.setFieldsValue({
            cpu: wfConfig.resource.cpu,
            memory: wfConfig.resource.memory,
            baseImage: wfConfig.baseImage,
            compileCommand: wfConfig.buildSpec?.command,
            deployCommand: wfConfig.deploySpec.command,
            ports: wfConfig.deploySpec.ports,
        })
    }
    initForm(wfConfig)
    useEffect(() => {
        initForm(wfConfig)
    }, [wfConfig])

    const [submitType, setSubmitType] = useState<SubmitType>()

    const getSubmitFields = (submitType: SubmitType) => {
        switch (submitType) {
            case 'git':
                return (
                    <>
                        <ProFormText
                            name="gitUrl"
                            label="Git仓库地址"
                            extra="请输入Git仓库地址，仅支持HTTP协议"
                            rules={[
                                { required: true, message: '请输入Git仓库地址' },
                                {
                                    type: 'url',
                                    message: 'Git仓库地址应该是合法的URL',
                                },
                            ]}
                        />
                        <ProFormText
                            name="gitRef"
                            label="Git仓库分支/Tag/Commit"
                            extra="请输入Git仓库分支/Tag/Commit，如果不填写则使用默认分支"
                        />
                        <ProFormText
                            name="gitUsername"
                            label="Git仓库用户名"
                            extra="如Git仓库为私有（需要鉴权），请填写此项"
                        />
                        <ProFormText.Password
                            name="gitPassword"
                            label="Git仓库密码"
                            extra="如Git仓库为私有（需要鉴权），请填写此项。有些Git平台（如GitHub）需要使用Token作为密码，而不应直接使用密码。"
                        />
                    </>
                )
            case 'zip':
                return (
                    <>
                        <ProFormUploadButton
                            name="zipInfo"
                            label="上传压缩包（zip、tar.gz、rar）"
                            accept=".zip,.tar.gz,.rar"
                            max={1}
                            fieldProps={{
                                data: {
                                    owner: getUserId(),
                                    involvedId: experiment.id,
                                    fileType: 'ExperimentWorkflowContext',
                                }
                            }}
                            action={`/api/v2/file?token=${getToken()}`}
                            required
                        />
                    </>
                )
        }
    }


    const onFinish = async (values: FormDataType) => {
        console.log(values)
        let url = values.zipInfo.at(0)?.response.files.at(0)?.downloadLink!!
        const structuredUrl = new URL(url)
        structuredUrl.searchParams.append('token', getToken())
        url = structuredUrl.href

        let context = {}
        switch (values.submitType) {
            case 'git':
                try {
                    if (!values.gitUrl) {
                        return false
                    }
                    const url = new URL(values.gitUrl)
                    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                        notificationError('请输入合法的使用HTTP协议的Git仓库地址')
                        return false
                    }
                    if (values.gitUsername) {
                        url.username = values.gitUsername
                    }
                    if (values.gitPassword) {
                        url.password = values.gitPassword
                    }
                    context = {
                        git: {
                            urlWithAuth: url.href,
                            ref: values.gitRef,
                        }
                    }
                } catch (_) {
                    notificationError('请输入合法的使用HTTP协议的Git仓库地址')
                    return false
                }
                break

            case 'zip':
                if (!url) {
                    return false
                }
                context = {
                    http: {
                        url: url
                    }
                }
        }
        const wfTemplate = workflowTemplates.find(wf => (wf.name === wfConfig.workflowTemplateName || wf.name === values.baseEnv))
        console.log(';llll', wfTemplate)
        const req: CreateWorkflowRequest = {
            confRespId: props.wfConfigRespId,
            ownerIdList: [getUserId()],
            tag: 'submit',
            expId: experiment.id,
            context: context,
            baseImage: values.baseImage,
            compileCommand: values.compileCommand,
            deployCommand: values.deployCommand,
            templateKey: wfTemplate?.key ?? 'custom',
            ports: values.ports?.map((port) => {
                return {
                    export: true,
                    port: parseInt(port.port),
                    protocol: port.protocol.toLowerCase() as ('tcp' | 'udp' | 'sctp'),
                }
            }),
        }

        try {
            if (props.oldWorkflow) {
                const updateReq: UpdateWorkflowRequest = {
                    workflowName: props.oldWorkflow?.metadata?.name!!,
                    ...req
                }
                await viewApiClient.updateWorkflow(updateReq)
            } else {
                await viewApiClient.createWorkflow(req)
            }
            messageSuccess('提交成功')
            return true
        } catch (_) {
            notificationError('提交失败')
            return false
        }
    }

    return (
        <>
            <ModalForm<FormDataType>
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
                    required
                />

                {submitType && getSubmitFields(submitType)}

                {
                    wfConfig.customOptions.baseImage && (
                        <>
                            <ProFormSelect
                                name="baseEnv"
                                label="基础环境"
                                valueEnum={(new Map(workflowTemplates?.map((template) => [template.name, template.name]) ?? []))}
                                fieldProps={{
                                    onChange: (value) => {
                                        const template = getWorkflowTemplateByName(value as string)
                                        formRef.current?.setFieldsValue({
                                            baseImage: template?.baseImage,
                                        })
                                        const customOptions = wfConfig.customOptions
                                        if (customOptions.compileCommand) {
                                            formRef.current?.setFieldValue('compileCommand', template?.buildSpec?.command)
                                        }
                                        if (customOptions.deployCommand) {
                                            formRef.current?.setFieldValue('deployCommand', template?.deploySpec?.command)
                                        }
                                        if (customOptions.ports) {
                                            formRef.current?.setFieldValue('ports', template?.deploySpec?.ports)
                                        }
                                    }
                                }}
                                tooltip={"请选择编译和运行所提交的源代码所需要使用的基础环境。"}
                                showSearch
                                required
                            />
                        </>
                    )
                }

                <ProFormText
                    name={"baseImage"}
                    label="自定义基础镜像"
                    tooltip={"请给出编译和运行所提交的源代码所需要使用的基础镜像。"}
                    disabled={true}
                />

                <ProFormText
                    name={"compileCommand"}
                    label="编译命令"
                    tooltip={"请给出编译所提交的源代码所需要使用的编译命令。如果命令较复杂，建议在提交的作业中提供编译脚本，并在此直接填写编译脚本的执行命令。\n请注意，该编译命令将会在所提交作业（压缩包或Git仓库）的根目录执行。"}
                    extra="请注意，该编译命令将会在所提交作业（压缩包或Git仓库）的根目录执行。"
                    disabled={!wfConfig.customOptions.compileCommand}
                />

                <ProFormText
                    name={"deployCommand"}
                    label="启动命令"
                    tooltip="请给出部署时所使用的命令。如果没有给出，将使用默认基础镜像的默认启动命令。"
                    disabled={!wfConfig.customOptions.deployCommand}
                />

                <ProFormList
                    name="ports"
                    label="端口信息"
                    copyIconProps={false}
                    creatorButtonProps={{
                        disabled: !wfConfig.customOptions.ports,
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
                            disabled={!wfConfig.customOptions.ports}
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
                            disabled={!wfConfig.customOptions.ports}
                        />
                    </ProFormGroup>
                </ProFormList>

                <ProFormGroup title="资源限额">
                    <ProFormDigit
                        name="cpu"
                        label="CPU限额"
                        min={1}
                        addonAfter="mCore"
                        extra="1 核 = 1000 mCore"
                        rules={[{ required: true }]}
                        disabled={true}
                    />
                    <ProFormDigit
                        name="memory"
                        label="内存限额"
                        min={1}
                        addonAfter="MB"
                        rules={[{ required: true }]}
                        disabled={true}
                    />
                </ProFormGroup>


            </ModalForm>
        </>
    )
}
