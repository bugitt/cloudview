import { DrawerForm, ProFormDigit, ProFormGroup, ProFormInstance, ProFormList, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProSchemaValueEnumObj } from "@ant-design/pro-components";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { Project } from "../../../cloudapi-client";
import { CreateDeployerRequest, DeployerContainer } from "../../../models/deployer";
import { ResourcePool } from "../../../models/resource";
import { viewApiClient } from "../../../utils/cloudapi";
import { messageInfo, notificationError } from "../../../utils/notification";
import { ResourcePoolProgress } from "../resource/ResourcePoolProgress";

interface AddDeployerFormProps {
    project: Project
    hook(): void
}

interface FormDataType {
    name: string
    image: string
    cpu: number
    memory: number
    workingDir?: string
    command?: string
    args?: string
    ports?: {
        port: string
        protocol: string
    }[]
    envs?: {
        key: string
        value: string
    }[]

    setup?: boolean
    resourcePool?: string
}

export function getResourcePoolListObj(resourcePoolList: ResourcePool[]) {
    const resourcePoolOptionsObj: ProSchemaValueEnumObj = {}
    resourcePoolList.forEach(pool => {
        resourcePoolOptionsObj[pool.metadata?.name!!] = (
            <ResourcePoolProgress resourcePool={pool} />
        )
    })
    return resourcePoolOptionsObj
}

export function AddDeployerForm(props: AddDeployerFormProps) {
    const formRef = useRef<ProFormInstance>()
    const { project, hook } = props
    const onFinish = async (values: FormDataType) => {
        const envs: {
            [k: string]: string
        } = {}
        if (values.envs) {
            values.envs.forEach((env) => {
                envs[env.key] = env.value
            })
        }
        const container: DeployerContainer = {
            name: 'container-main',
            image: values.image,
            resource: {
                cpu: values.cpu,
                memory: values.memory,
            },
            workingDir: values.workingDir,
            args: values.args?.split('\n'),
            command: values.command?.split('\n'),
            env: envs,
            ports: values.ports?.map((port) => {
                return {
                    export: true,
                    port: parseInt(port.port),
                    protocol: port.protocol.toLowerCase() as ('tcp' | 'udp' | 'sctp'),
                }
            }),
            initial: false,
        }
        const req: CreateDeployerRequest = {
            name: values.name,
            projectName: project.name,
            containers: [container],
            type: 'service',
            resourcePool: values.resourcePool || "",
            setup: values.setup,
        }
        try {
            await viewApiClient.createDeployer(req)
            messageInfo("提交部署任务成功")
            hook()
            return true
        } catch (_) {
            notificationError("提交部署任务失败")
            return false
        }
    }
    const [resourcePoolList, setResourcePoolList] = useState<ResourcePool[]>([])
    const [setup, setSetup] = useState(false)
    useEffect(() => {
        if (setup) {
            viewApiClient.getProjectResourcePools(project.id).then((list) => {
                setResourcePoolList(list)
            })
        }
    }, [project, setup])

    return (
        <DrawerForm<FormDataType>
            title="添加部署任务"
            formRef={formRef}
            onFinish={onFinish}
            name="create_deployer"
            layout="vertical"
            trigger={<Button type="primary">添加部署任务</Button>}
        >
            <ProFormText
                label="任务名称"
                name="name"
                required
            />
            <ProFormText
                label="镜像"
                name="image"
                placeholder={`请输入镜像名称，如：docker.io/library/mysql:8`}
                required
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
            <ProFormText name="workingDir" label="工作路径" />
            <ProFormTextArea
                label="启动命令"
                name="command"
                placeholder={`请输入启动命令，如：/bin/bash，如果不填写则使用镜像的默认启动命令。\n若有启动命令包含多个部分，请用回车隔开。`}
            />
            <ProFormTextArea
                label="启动参数"
                name="args"
                placeholder={`请输入启动参数，如：-c 1，如果不填写则使用镜像的默认启动参数。\n若有启动参数包含多个部分（即，在原命令行中需要使用空格隔开的多个部分），请在此用回车隔开。`}
            />
            <ProFormList
                name="envs"
                label="环境变量"
                copyIconProps={false}
                creatorButtonProps={{
                    creatorButtonText: '添加一对环境变量'
                }}
                deleteIconProps={{
                    tooltipText: '删除'
                }}
            >
                <ProFormGroup key="envGroup">
                    <ProFormText
                        name="key"
                        label="键"
                        rules={[{ required: true }]}
                    />
                    <ProFormText
                        name="value"
                        label="值"
                        rules={[{ required: true }]}
                    />
                </ProFormGroup>
            </ProFormList>
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
                        extra="各个容器暴露的端口号互相之间不能重复"
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
            <ProFormSwitch
                name="setup"
                label="是否需要立即部署"
                checkedChildren="是"
                fieldProps={{
                    onChange: (checked) => {
                        setSetup(checked)
                    }
                }}
            />
            {
                setup ? (
                    <>
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
                    </>
                ) : null
            }

        </DrawerForm>
    )
}