import { ProForm, ProFormInstance, ProFormItem, ProFormRadio, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Drawer } from "antd";
import { useRef, useState } from "react";
import { Project } from "../../../cloudapi-client";
import { CreateImageBuilderRequest } from "../../../models/createImageBuilderRequest";
import { viewApiClient } from "../../../utils/cloudapi";
import { messageInfo, notificationError } from "../../../utils/notification";

interface AddImageBuilderFormProps {
    project: Project
    hook(): void
}

interface CreateImageBuilderFormDataType {
    imageName: string
    imageTag?: string
    gitUrl?: string
    gitRef?: string
    gitUsername?: string
    gitPassword?: string
    s3ObjectKey?: string
    raw?: string
    dockerfilePath?: string
    workspacePath?: string
}

export function AddImageBuilderForm(props: AddImageBuilderFormProps) {
    const formRef = useRef<ProFormInstance>()
    const [open, setOpen] = useState(false);

    const { project, hook } = props

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const onFinish = async (values: CreateImageBuilderFormDataType) => {
        let context = {}
        if (values.gitUrl) {
            try {
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
        }
        if (values.raw) {
            const dockerfileContent = values.raw!!
            context = {
                raw: dockerfileContent,
            }
        }
        if (!values.gitUrl && !values.raw) {
            notificationError('请输入Git仓库地址或者Dockerfile内容')
            return false
        }
        const req: CreateImageBuilderRequest = {
            projectName: project.name,
            imageMeta: {
                name: values.imageName,
                tag: values.imageTag || 'latest',
            },
            context: context,
            dockerfilePath: values.dockerfilePath || 'Dockerfile',
            workspacePath: values.workspacePath || '',
        }
        if (req.context.raw) {
            req.dockerfilePath = "Dockerfile"
        }
        try {
            await viewApiClient.createImageBuilder(req)
            messageInfo('提交镜像构建任务成功')
            await hook()
            formRef.current?.resetFields()
            onClose()
            return true
        } catch (err) {
            notificationError('提交镜像构建任务失败')
            return false
        }
    }

    formRef.current?.setFieldValue('imageTag', 'latest')
    formRef.current?.setFieldValue('dockerfilePath', './Dockerfile')

    const [builderType, setBuilderType] = useState('')
    const [dockerfileEditable, setDockerfileEditable] = useState(true)
    const [rawOverride, setRawOverride] = useState(false)

    return (
        <>
            <Button type="primary" onClick={showDrawer}>
                添加镜像构建任务
            </Button>
            <Drawer title="添加镜像构建任务" placement="right" onClose={onClose} open={open}>
                <ProForm<CreateImageBuilderFormDataType>
                    formRef={formRef}
                    name="create_image_builder"
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <ProFormText
                        name="imageName"
                        label="镜像名称"
                        rules={[
                            { required: true, message: '请输入镜像名称' },
                            {
                                type: 'string',
                                validator: (_, value) => {
                                    const name = value as string
                                    if (name.length > 255) {
                                        return Promise.reject('镜像名称应该小于等于255个字符')
                                    }
                                    if (!/^[a-z]+(?:[_-][a-z0-9]+)*$/.test(name)) {
                                        return Promise.reject('镜像名称仅能包含小写字母、数字、下划线（_）、和短横线（-）（但下划线和短横线不能连续出现），并且必须以小写字母或数字开头和结尾')
                                    }
                                    return Promise.resolve()
                                }
                            },
                        ]}
                    />
                    <ProFormText
                        name="imageTag"
                        label="镜像标签"
                        rules={[
                            { required: true, message: '请输入镜像标签' },
                            {
                                type: 'string',
                                validator: (_, value) => {
                                    const name = value as string
                                    // A tag name must be valid ASCII and may contain lowercase and uppercase letters, digits, underscores, periods and dashes. A tag name may not start with a period or a dash and may contain a maximum of 128 characters.
                                    if (name.length > 128) {
                                        return Promise.reject('镜像标签应该小于等于128个字符')
                                    }
                                    if (!/[\w][\w-.]{0,127}$/.test(name)) {
                                        return Promise.reject('镜像标签仅能包含大小写字母、数字、下划线（_）、句号（.）、短横线（-），并且不能以句号（.）和短横线（-）开头')
                                    }
                                    return Promise.resolve()
                                }
                            },
                        ]}
                    />

                    <ProFormRadio.Group
                        name="builderType"
                        label="选择构建方式"
                        fieldProps={{
                            onChange: (val) => {
                                const value = val.target.value as string
                                setBuilderType(value)
                                if (value === 'raw') {
                                    formRef.current?.setFieldValue('dockerfilePath', './Dockerfile')
                                    setDockerfileEditable(false)
                                } else {
                                    setDockerfileEditable(true)
                                }
                            },
                        }}
                        options={[
                            {
                                label: '从Git仓库构建',
                                value: 'git',
                            },
                            {
                                label: '直接从Dockerfile构建',
                                value: 'raw',
                            },
                        ]}
                        rules={[
                            {
                                required: true,
                                message: '请选择构建方式',
                            },
                        ]}
                    />

                    {builderType === 'git' ? (<>
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
                    </>) : null}

                    {builderType === 'raw' ? null : (<ProFormText
                        name="workspacePath"
                        label="构建上下文路径"
                        extra="请输入构建上下文相对于Git仓库根目录的相对路径，如果不填写则直接使用Git仓库的根目录"
                    />)}

                    <ProFormText
                        name="dockerfilePath"
                        label="Dockerfile路径"
                        extra="请输入Dockerfile相对于构建上下文的相对路径，如果不填写则使用默认路径"
                        disabled={!dockerfileEditable}
                    />

                    {builderType === 'git' ? (<>
                        <ProFormSwitch
                            name="rawOverride"
                            label="是否覆盖Dockerfile"
                            extra="如果勾选此项，则可以显式提供Dockerfile覆盖Git仓库中的Dockerfile"
                            fieldProps={{
                                onChange: (val) => {
                                    setRawOverride(val)
                                },
                            }}
                        />
                    </>) : null}

                    {builderType === 'raw' || builderType === 'git' && rawOverride ?
                        (<>
                            <ProFormTextArea
                                label="Dockerfile"
                                name="raw"
                                placeholder={`请在此处输入Dockerfile内容`}
                                fieldProps={{
                                    autoSize: { minRows: 10 },
                                }}
                                rules={[
                                    { required: true, message: '请输入Dockerfile' }
                                ]}
                            />
                        </>) : null}
                </ProForm>
            </Drawer>
        </>
    );
}