import {
    ModalForm,
    ProFormDigit,
    ProFormGroup,
    ProFormInstance,
    ProFormList,
    ProFormSelect,
    ProFormText
} from '@ant-design/pro-form'
import { Button, Card, Progress } from 'antd'
import { ProjectIdProps } from '../../../assets/types'
import { ContainerServiceRequest, ResourcePool } from '../../../cloudapi-client'
import {
    cloudapiClient,
    formItemProjectNameValidator,
    messageError,
    messageInfo,
    notificationError,
    projectNameExtraInfo,
    randomString
} from '../../../utils'
import { useEffect, useRef, useState } from 'react'
import { useRequest } from 'ahooks'
import { ProSchemaValueEnumObj } from '@ant-design/pro-components'
import { ResourcePoolProgress } from '../resource/ResourcePoolProgress'

export const CreateContainerServiceForm = (props: ProjectIdProps) => {
    const formRef = useRef<ProFormInstance>()
    const [resourcePools, setResourcePools] = useState<ResourcePool[]>([])

    const resourcePoolsReq = useRequest(
        () => cloudapiClient.getProjectProjectIdResourcePools(props.projectId),
        {
            manual: true,
            onSuccess: (result, params) => {
                setResourcePools(result.data)
            },
            onError: error => {
                notificationError(error)
            }
        }
    )
    useEffect(() => {
        resourcePoolsReq.run()
    }, [props.projectId])

    const resourcePoolOptionsObj: ProSchemaValueEnumObj = {}
    resourcePools.forEach(pool => {
        resourcePoolOptionsObj[pool.id] = (
            <ResourcePoolProgress resourcePool={pool} />
        )
    })

    const onFinish = async (values: any) => {
        if (!values.containers || (values.containers as any[]).length === 0) {
            notificationError('请至少添加一个容器')
            return
        }
        let resourceValid = true
        ;(values.containers as any[]).forEach(container => {
            const resourcePoolId = container.resourcePool as string
            const reqCPU = container.cpu as number
            const reqMemory = container.memory as number
            const { used, capacity } = resourcePools.find(
                it => it.id === resourcePoolId
            )!!
            if (
                used.cpu + reqCPU > capacity.cpu ||
                used.memory + reqMemory > capacity.memory
            ) {
                notificationError(
                    `容器 ${container.name} 申请资源超出资源池限额，请重新调整`
                )
                resourceValid = false
            }
        })
        if (!resourceValid) return
        const req: ContainerServiceRequest = {
            name: values.name,
            serviceType: values.serviceType,
            containers: (values.containers as any[]).map(container => {
                return {
                    name: container.name,
                    image: container.image,
                    command: container.command,
                    workingDir: container.workingDir,
                    envs:
                        (container.envs as any[])?.map(env => {
                            return {
                                key: env.key,
                                value: env.value
                            }
                        }) || [],
                    ports:
                        (container.ports as any[])?.map(port => {
                            return {
                                name: port.name,
                                port: port.port,
                                protocol: port.protocol
                            }
                        }) || [],
                    resourcePoolId: container.resourcePool as string,
                    limitedResource: {
                        cpu: container.cpu as number,
                        memory: container.memory as number
                    }
                }
            })
        }
        try {
            await cloudapiClient.postProjectProjectIdContainers(
                props.projectId,
                req
            )
            messageInfo(`容器服务 ${values.name} 已成功加入任务队列`)
            formRef?.current?.resetFields()
            resourcePoolsReq.run()
            return true
        } catch (_) {
            messageError(`提交容器服务失败`)
            return false
        }
    }

    return (
        <ModalForm
            name="create_container_service"
            onFinish={onFinish}
            formRef={formRef}
            autoComplete="off"
            width="2000px"
            trigger={<Button type="primary">创建容器服务</Button>}
        >
            <ProFormText
                name="name"
                label="容器服务名称"
                extra={projectNameExtraInfo}
                rules={[
                    { required: true },
                    {
                        type: 'string',
                        validator: (_, value) =>
                            formItemProjectNameValidator(value)
                    }
                ]}
            />

            <ProFormSelect
                name="serviceType"
                label="容器服务类型"
                valueEnum={{
                    JOB: '单次任务',
                    SERVICE: '守护进程'
                }}
                placeholder="请选择"
                rules={[{ required: true }]}
            />

            <ProFormList
                name="containers"
                label="容器信息列表（一个容器服务中可以包含多个容器实例）："
                creatorButtonProps={{
                    style: {
                        backgroundColor: '#E8F3FE',
                        color: 'rgb(9, 88, 217)'
                    },
                    creatorButtonText: '添加一个新容器'
                }}
                copyIconProps={false}
                deleteIconProps={{
                    tooltipText: '删除该容器'
                }}
                itemRender={({ listDom, action }, { index }) => {
                    return (
                        <>
                            <Card
                                bordered
                                extra={action}
                                title={`容器-${index}`}
                                headStyle={{
                                    backgroundColor: 'rgb(230,244,255)',
                                    color: 'rgb(9,88,217)'
                                }}
                                style={{ marginBottom: 25, marginTop: 25 }}
                            >
                                {listDom}
                            </Card>
                        </>
                    )
                }}
            >
                <ProFormText
                    name="name"
                    label="容器名称"
                    initialValue={`container-${randomString(7)}`}
                    extra={`容器名称主要起标识作用，用以区分同一个服务中的多个容器。${projectNameExtraInfo}`}
                    rules={[
                        {
                            required: true,
                            message: '必须填写合法的容器名称'
                        },
                        {
                            type: 'string',
                            validator: (_, value) =>
                                formItemProjectNameValidator(value)
                        }
                    ]}
                />
                <ProFormText
                    name="image"
                    label="镜像地址"
                    rules={[{ required: true }]}
                />
                <ProFormGroup label="容器资源配额">
                    <ProFormSelect
                        name="resourcePool"
                        label="资源池"
                        valueEnum={resourcePoolOptionsObj}
                        placeholder="请选择资源池"
                        width={350}
                        rules={[
                            {
                                required: true,
                                message: '必须为每个容器指定资源池'
                            }
                        ]}
                    />
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
                <ProFormText name="command" label="启动命令" />
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
                        creatorButtonText: '添加需要暴露的端口'
                    }}
                    deleteIconProps={{
                        tooltipText: '删除'
                    }}
                >
                    <ProFormGroup key="portGroup">
                        <ProFormText
                            name="name"
                            label="名称"
                            extra={`端口号名称主要起标识作用，${projectNameExtraInfo}`}
                            rules={[
                                { required: true },
                                {
                                    type: 'string',
                                    validator: (_, value) =>
                                        formItemProjectNameValidator(value)
                                }
                            ]}
                            placeholder="请输入端口名称"
                        />
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
            </ProFormList>
        </ModalForm>
    )
}
