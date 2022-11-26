import {
    ModalForm,
    ProFormGroup,
    ProFormInstance,
    ProFormList,
    ProFormSelect,
    ProFormText
} from '@ant-design/pro-form'
import { Button, Card } from 'antd'
import { ProjectIdProps } from '../../../assets/types'
import { ContainerServiceRequest } from '../../../cloudapi-client'
import {
    cloudapiClient,
    formItemProjectNameValidator,
    messageError,
    messageInfo,
    notificationError,
    projectNameExtraInfo,
    randomString
} from '../../../utils'
import { useRef } from 'react'

export const CreateContainerServiceForm = (props: ProjectIdProps) => {
    const formRef = useRef<ProFormInstance>()
    const onFinish = async (values: any) => {
        console.log(formRef.current)
        if (!values.containers || (values.containers as any[]).length === 0) {
            notificationError('请至少添加一个容器')
            return
        }
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
                        }) || []
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
