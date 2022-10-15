import { Button, Form, Input, Select } from 'antd'
import React, { useState } from 'react'
import {
    FileResponse,
    PostProjectProjectIdImagesRequest
} from '../../cloudapi-client'
import { ProjectIdProps } from '../../assets/types'
import { FileUpload } from '../base/UploadFile'
import {
    cloudapiClient,
    formItemProjectNameValidator,
    getUserId,
    messageError,
    messageSuccess,
    projectNameExtraInfo
} from '../../utils'
import MonacoEditor from 'react-monaco-editor'
import { editor } from 'monaco-editor'
import { ModalForm } from '@ant-design/pro-form'
import LineNumbersType = editor.LineNumbersType

interface CreateImageFormData {
    name: string
    tag: string
    buildType: string
    gitUrl: string
    gitUsername: string
    gitPassword: string
    gitRef: string
    contextFile: FileResponse | undefined
    contextFileLink: string
    workspacePath: string
    dockerfileType: string
    dockerfileContent: string
    dockerfilePath: string
}

export const CreateImageForm = (props: ProjectIdProps) => {
    const [form] = Form.useForm<CreateImageFormData>()
    const [_, contextFileState] = useState<FileResponse | undefined>(undefined)
    const [buildType, buildTypeState] = useState<string>('')
    const [dockerfileType, dockerfileTypeState] = useState<string>('')

    const contextFileUploadHook = (fileList: FileResponse[]) => {
        if (fileList.length > 0) {
            contextFileState(fileList[0])
        } else {
            contextFileState(undefined)
        }
    }

    const onBuildTypeChange = (value: string) => {
        buildTypeState(value)
        if (value === 'raw') {
            dockerfileTypeState('dockerfileContent')
        }
    }

    const onDockerfileTypeChange = (value: string) => {
        dockerfileTypeState(value)
    }

    const onFinish = async (values: CreateImageFormData) => {
        const req: PostProjectProjectIdImagesRequest = {
            name: values.name,
            tag: values.tag === '' ? 'latest' : values.tag
        }

        // handle context
        switch (values.buildType) {
            case 'git':
                if (req.gitUrl === '') {
                    messageError('请输入Git仓库地址')
                    return false
                }
                req.gitUrl = values.gitUrl
                if (req.gitUsername !== '') {
                    req.gitUsername = values.gitUsername
                }
                if (req.gitPassword !== '') {
                    req.gitPassword = values.gitPassword
                }
                if (req.gitRef !== '') {
                    req.gitRef = values.gitRef
                }
                break
            case 'localFile':
                if (!values.contextFile) {
                    messageError('请选择上下文文件')
                    return false
                }
                req.contextFileId = values.contextFile.id
                break
            case 'localRemoteLink':
                if (values.contextFileLink === '') {
                    messageError('请输入上下文文件链接')
                    return false
                }
                req.contextFileLink = values.contextFileLink
                break
            case 'raw':
                if (values.dockerfileContent === '') {
                    messageError('请输入Dockerfile内容')
                    return false
                }
                req.dockerfileContent = values.dockerfileContent
        }
        req.workspacePath = values.workspacePath

        // handle dockerfile
        switch (values.dockerfileType) {
            case 'dockerfileContent':
                if (values.dockerfileContent === '') {
                    messageError('请输入Dockerfile内容')
                    return false
                }
                req.dockerfileContent = values.dockerfileContent
                break
            case 'dockerfilePath':
                if (values.dockerfilePath === '') {
                    messageError('请输入Dockerfile路径')
                    return false
                }
                req.dockerfilePath = values.dockerfilePath
                break
        }
        try {
            await cloudapiClient.postProjectProjectIdImages(
                props.projectId,
                req
            )
            messageSuccess('成功提交到镜像构建任务队列')
            return true
        } catch (_) {
            messageError('提交镜像构建任务失败')
            return false
        }
    }

    const dockerfileEditorOptions = {
        selectOnLineNumbers: false,
        tabSize: 4,
        lineNumbers: 'on' as LineNumbersType,
        language: 'dockerfile'
    }

    return (
        <ModalForm<CreateImageFormData>
            form={form}
            onFinish={onFinish}
            trigger={<Button type="primary">创建镜像</Button>}
            layout="vertical"
        >
            <Form.Item
                name="name"
                label="镜像名称"
                extra={[projectNameExtraInfo]}
                rules={[
                    { required: true, message: '请输入镜像名称' },
                    {
                        type: 'string',
                        validator: (_, value) =>
                            formItemProjectNameValidator(value)
                    }
                ]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="tag"
                label="镜像标签"
                rules={[{ required: false }]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                label="构建方式"
                name="buildType"
                rules={[{ required: true, message: '请选择镜像构建方式' }]}
                extra='大多数情况下，构建镜像需要提供一些文件（我们称之为"上下文"），如Dockerfile、requirements.txt、源代码等，这些文件可以通过上传本地压缩包、提供线上的压缩包链接或者拉取Git仓库等方式获取。'
            >
                <Select
                    placeholder="请选择构建镜像所需的上下文来源"
                    onChange={onBuildTypeChange}
                >
                    <Select.Option value="git">从现有Git仓库构建</Select.Option>
                    <Select.Option value="localFile">
                        上传本地压缩包
                    </Select.Option>
                    <Select.Option value="localRemoteLink">
                        使用远程压缩包链接
                    </Select.Option>
                    <Select.Option value="raw">
                        直接从单独的Dockerfile构建
                    </Select.Option>
                </Select>
            </Form.Item>
            {/*不同的上下文构建方式*/}
            {buildType === 'git' ? (
                <>
                    <Form.Item
                        label="Git仓库地址"
                        name="gitUrl"
                        rules={[
                            { required: true, message: '请输入Git仓库地址' },
                            {
                                type: 'url',
                                message: '请输入合法的使用HTTP协议的Git仓库地址'
                            }
                        ]}
                    >
                        <Input placeholder="请保证以 http:// 或 https:// 开头" />
                    </Form.Item>
                    <Form.Item
                        label="Git仓库用户名"
                        name="gitUsername"
                        extra="如果Git仓库为私有仓库，请输入有访问权限的用户名"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Git仓库密码"
                        name="gitPassword"
                        extra="如果Git仓库为私有仓库，请输入有访问权限的用户对应的密码或Token"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Git仓库引用"
                        name="gitRef"
                        extra="请输入需要使用的仓库分支或commit值，默认为主分支当前最新commit"
                    >
                        <Input />
                    </Form.Item>
                </>
            ) : buildType === 'localFile' ? (
                <>
                    <Form.Item label="构建上下文压缩包" name="fileList">
                        <FileUpload
                            fileType={'ImageBuildContextTar'}
                            owner={getUserId()}
                            involvedId={props.projectId}
                            maxCount={1}
                            fileListProcessHook={contextFileUploadHook}
                        />
                    </Form.Item>
                </>
            ) : buildType === 'localRemoteLink' ? (
                <>
                    <Form.Item
                        label="远程压缩包链接"
                        name="contextFileLink"
                        rules={[
                            { required: true, message: '请输入远程压缩包链接' },
                            {
                                type: 'url',
                                message:
                                    '请输入合法的使用HTTP协议的远程压缩包链接'
                            }
                        ]}
                    >
                        <Input placeholder="请保证以 http:// 或 https:// 开头" />
                    </Form.Item>
                </>
            ) : null}

            {buildType === 'raw' || buildType === '' ? null : (
                <Form.Item
                    label="上下文路径"
                    name="workspacePath"
                    initialValue="."
                    extra='构建镜像时，所使用的上下文目录相对于压缩包或Git仓库的根目录的相对路径。默认为"."'
                    rules={[
                        {
                            validator: (_, value) => {
                                if (
                                    value.startsWith('/') ||
                                    value.startsWith('\\')
                                ) {
                                    return Promise.reject(
                                        new Error(
                                            '上下文路径应为相对路径，不能以/或\\开头'
                                        )
                                    )
                                }
                                if (value.contains(' ')) {
                                    return Promise.reject(
                                        new Error('上下文路径不能包含空格')
                                    )
                                }
                                return Promise.resolve()
                            }
                        }
                    ]}
                >
                    <Input />
                </Form.Item>
            )}

            {/*不同的dockerfile选择*/}
            {buildType === 'raw' || buildType === '' ? null : (
                <Form.Item
                    label="如何指定Dockerfile"
                    name="dockerfileType"
                    rules={[
                        { required: true, message: '请选择如何指定Dockerfile' }
                    ]}
                >
                    <Select
                        placeholder="请选择如何指定Dockerfile"
                        onChange={onDockerfileTypeChange}
                    >
                        <Select.Option value="dockerfileContent">
                            手动输入Dockerfile内容
                        </Select.Option>
                        <Select.Option value="dockerfilePath">
                            使用上下文中已有的Dockerfile
                        </Select.Option>
                    </Select>
                </Form.Item>
            )}
            {dockerfileType === 'dockerfileContent' ? (
                <>
                    <Form.Item
                        label="Dockerfile"
                        name="dockerfileContent"
                        initialValue={`# 请在此处输入Dockerfile内容`}
                        rules={[
                            { required: true, message: '请输入Dockerfile' }
                        ]}
                    >
                        <MonacoEditor
                            height="200"
                            language="dockerfile"
                            theme="vs-dark"
                            options={dockerfileEditorOptions}
                        />
                    </Form.Item>
                </>
            ) : dockerfileType === 'dockerfilePath' ? (
                <Form.Item
                    label="Dockerfile路径"
                    name="dockerfilePath"
                    initialValue="Dockerfile"
                    rules={[{ required: true, message: '请输入Dockerfile' }]}
                    extra="使用的dockerfile文件相对于上下文路径的相对路径"
                >
                    <Input />
                </Form.Item>
            ) : null}
        </ModalForm>
    )
}
