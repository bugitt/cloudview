import { DrawerForm, ProFormDigit, ProFormGroup, ProFormInstance, ProFormList, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProFormUploadButton } from "@ant-design/pro-components";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { Project } from "../../cloudapi-client";
import { getCrdDisplayName } from "../../models/crd";
import { ResourcePool } from "../../models/resource";
import { CreateWorkflowRequest, UpdateWorkflowRequest, Workflow, WorkflowTemplate } from "../../models/workflow";
import { viewApiClient } from "../../utils/cloudapi";
import { messageSuccess, notificationError } from "../../utils/notification";
import { randomString } from "../../utils/random";
import { getUserId, getToken } from "../../utils/token";
import { getResourcePoolListObj } from "../projects/deployer/AddDeployerForm";
import { workflowTemplates } from "./workflowTemplates";

interface Props {
    project: Project
    oldWorkflow?: Workflow
    title?: string
    hook?: () => void
}

interface FormDataType {
    name: string
    zipInfo?: { response: string }[]
    baseEnv: string
    baseImage: string
    resourcePool: string,
    cpu: number,
    memory: number,
    compileCommand?: string,
    deployCommand?: string,
    ports?: {
        port: string
        protocol: string
    }[]
}

const getWorkflowTemplateByName = (name?: string) => {
    return workflowTemplates.find((template) => template.name === name)
}

export function PersonalCreateWorkflowForm(props: Props) {
    const { project } = props
    const formRef = useRef<ProFormInstance>()
    const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplate>()
    const [extraFields, setExtraFields] = useState<React.ReactNode>(<></>)
    const [resourcePoolList, setResourcePoolList] = useState<ResourcePool[]>([])
    const [fileUploadInfo, setFileUploadInfo] = useState<string>('')
    const [needCompile, setNeedCompile] = useState<boolean>(true)
    useEffect(() => {
        viewApiClient.getProjectResourcePools(project.id).then((list) => {
            setResourcePoolList(list)
        })
    }, [project.id])

    const onFinish = async (values: any) => {
        const typedValues = values as FormDataType
        const fileUrl = typedValues.zipInfo?.at(0)?.response
        let req: CreateWorkflowRequest = {
            ownerIdList: [getUserId()],
            tag: randomString(15),
            annotation: {
                'displayName': typedValues.name,
            },
            expId: project.expId,
            context: fileUrl ? {
                http: {
                    url: fileUrl,
                }
            } : undefined,
            baseImage: typedValues.baseImage,
            compileCommand: typedValues.compileCommand,
            deployCommand: typedValues.deployCommand,
            resource: {
                cpu: typedValues.cpu,
                memory: typedValues.memory,
            },
            resourcePool: typedValues.resourcePool,
            templateKey: workflowTemplate?.key ?? 'custom',
            ports: typedValues.ports?.map((port) => {
                return {
                    export: true,
                    port: parseInt(port.port),
                    protocol: port.protocol.toLowerCase() as ('tcp' | 'udp' | 'sctp'),
                }
            }),
        }
        if (workflowTemplate?.decorateCreateWorkflowRequest) {
            req = workflowTemplate.decorateCreateWorkflowRequest?.(req, values)
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
            props.hook?.()
            return true
        } catch (_) {
            notificationError('提交失败')
            return false
        }
    }

    const workflow = props.oldWorkflow
    if (workflow) {
        formRef.current?.setFieldsValue({
            'name': getCrdDisplayName(workflow),
        })
    }

    return (<>
        <DrawerForm
            formRef={formRef}
            onFinish={onFinish}
            trigger={<Button type='primary'>{props.title ? props.title : "添加新的工作流"}</Button>}
        >
            <ProFormText
                name='name'
                label='工作流名称'
                placeholder={'工作流名称，用于标识同一项目中不同工作流，无格式要求'}
                rules={[{ required: true, message: '请输入工作流名称' }]}
                disabled={!!props.oldWorkflow}
            />

            <ProFormSelect
                name="baseEnv"
                label="基础环境"
                valueEnum={(new Map(workflowTemplates?.map((template) => [template.name, template.name]) ?? [])).set("custom", "自定义")}
                fieldProps={{
                    onChange: (value) => {
                        const template = getWorkflowTemplateByName(value as string)
                        setWorkflowTemplate(template)
                        formRef.current?.setFieldsValue({
                            baseImage: template?.baseImage,
                            cpu: template?.resource.cpu,
                            memory: template?.resource.memory,
                            compileCommand: template?.buildSpec?.command,
                            deployCommand: template?.deploySpec?.command,
                            ports: template?.deploySpec?.ports,
                            needCompile: template?.needCompile ?? false,
                        })
                        setExtraFields(template?.extraFormItems ?? <></>)
                        setFileUploadInfo(template?.fileUploadInfo ?? '')
                        setNeedCompile(template?.needCompile ?? false)
                    }
                }}
                tooltip={"请选择编译和运行所提交的源代码所需要使用的基础环境。"}
                showSearch
                required
            />

            <ProFormText
                name='baseImage'
                label='基础镜像'
                required
            />

            <ProFormSwitch
                name='needCompile'
                label='是否需要编译'
                fieldProps={{
                    onChange: (value) => {
                        setNeedCompile(value)
                    }
                }}
                checkedChildren="是"
                unCheckedChildren="否"
                initialValue={true}
            />

            {needCompile && <ProFormUploadButton
                name="zipInfo"
                label="上传压缩包（zip、tar.gz、rar）"
                accept=".zip,.tar.gz,.rar"
                max={1}
                extra={fileUploadInfo}
                action={`https://scs.buaa.edu.cn/api/v2/scsos?overrideName=true&token=${getToken()}`}
                required
            />}

            {
                needCompile && <ProFormTextArea
                    name={"compileCommand"}
                    label="编译命令"
                    placeholder={"请给出编译所提交的源代码所需要使用的编译命令。如果命令较复杂，建议在提交的压缩包中提供编译脚本，并在此直接填写编译脚本的执行命令。\n请注意，该编译命令将会在所提交的压缩包根目录执行。"}
                    tooltip={"请给出编译所提交的源代码所需要使用的编译命令。如果命令较复杂，建议在提交的压缩包中提供编译脚本，并在此直接填写编译脚本的执行命令。\n请注意，该编译命令将会在所提交的压缩包根目录执行。"}
                    extra="请注意，该编译命令将会在所提交的压缩包的根目录执行。"
                />
            }

            <ProFormTextArea
                name={"deployCommand"}
                label="启动命令"
                placeholder="请给出部署时所使用的命令。如果没有给出，将使用默认基础镜像的默认启动命令。"
            />

            {extraFields}

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

            <ProFormSelect
                name="resourcePool"
                label="资源池"
                valueEnum={getResourcePoolListObj(resourcePoolList)}
                placeholder="请选择资源池"
                width={350}
                rules={[
                    {
                        required: true,
                        message: '如需启动服务，必须指定资源池'
                    }
                ]}
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

        </DrawerForm>
    </>)
}