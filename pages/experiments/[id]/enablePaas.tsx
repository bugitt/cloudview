import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { ExperimentResponse } from "../../../lib/cloudapi-client"
import { serverSideCloudapiClient, viewApiClient } from "../../../lib/utils/cloudapi"
import { BaseSSRType } from "../../../lib/utils/type"
import { setUserInfo, ssrUserInfo } from "../../../lib/utils/token"
import { ProForm, ProFormCheckbox, ProFormDependency, ProFormGroup, ProFormInstance, ProFormList, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components"
import { useRef, useState } from "react"
import { useRequest } from "ahooks"
import { WorkflowTemplate } from "../../../lib/models/workflow"
import { filepathJoin } from "../../../lib/utils/filepath"

interface ExperimentProps extends BaseSSRType {
    experiment: ExperimentResponse
}

export default function EnablePaasForm(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { experiment, userInfo } = props
    setUserInfo(userInfo)

    const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplate | undefined>(undefined)
    const [needCompile, setNeedCompile] = useState<boolean>(false)
    const [changeEnv, setChangeEnv] = useState<boolean>(false)

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
                    name="workflowTemplate"
                    label="工作流模板"
                    valueEnum={new Map(workflowTemplates?.map((template) => [template.name, template.name]) ?? [])}
                    fieldProps={{
                        onChange: (value) => {
                            const template = workflowTemplates?.find((template) => template.name === value)
                            setWorkflowTemplate(workflowTemplates?.find((template) => template.name === value))
                            const needCompile = !!template?.buildSpec
                            setNeedCompile(needCompile)
                            setChangeEnv(template?.deploySpec.changeEnv ?? false)
                            formRef.current?.setFieldsValue({
                                needCompile: needCompile,
                                compileBaseImage: template?.buildSpec?.baseImage,
                                compileWorkingDir: template?.buildSpec?.workingDir,
                                compileCommand: template?.buildSpec?.command,
                                changeEnv: template?.deploySpec.changeEnv,
                                deployBaseImage: template?.deploySpec.baseImage,
                                deployFilePairSource: template?.deploySpec?.filePair?.source,
                                deployFilePairTarget: template?.deploySpec?.filePair?.target,
                                deployCommand: template?.deploySpec?.command,
                                ports: template?.deploySpec?.ports,
                            })
                        }
                    }}
                    showSearch
                />

                <ProFormSwitch
                    name="needCompile"
                    label="是否需要编译"
                    checkedChildren="是"
                    unCheckedChildren="否"
                    fieldProps={{
                        onChange: (value) => {
                            setNeedCompile(value)
                        }
                    }}
                    required
                />

                {needCompile &&
                    <>
                        <ProFormText
                            name="compileBaseImage"
                            label="编译所用的镜像环境"
                            required
                        />

                        <ProFormText
                            name="compileWorkingDir"
                            label="编译时的工作路径"
                            tooltip="该工作路径为相对于提交的作业（压缩包或Git仓库）的相对路径，为执行编译命令时的工作路径。"
                        />

                        <ProFormDependency name={['compileWorkingDir']}>
                            {({ compileWorkingDir }) => {
                                return (
                                    <ProFormTextArea
                                        name={"compileCommand"}
                                        label="编译命令"
                                        tooltip="请给出编译所提交的源代码所需要使用的编译命令"
                                        extra={`请注意，所提交的作业的根目录在编译所在机器上的绝对路径为 /workspace , 执行该编译命令所位于的绝对路径为 ${filepathJoin(['/workspace', compileWorkingDir])}`}
                                        required
                                    />
                                );
                            }}
                        </ProFormDependency>
                    </>
                }

                <ProFormSwitch
                    name="changeEnv"
                    label="是否使用新的环境进行部署"
                    tooltip="你可以选择在编译完成后，将编译产物提取出来，使用新的环境进行部署。如果该选项为否，那么将继续使用上述编译环境进行部署和运行。"
                    checkedChildren="是"
                    unCheckedChildren="否"
                    fieldProps={{
                        onChange: (value) => {
                            setChangeEnv(value)
                        }
                    }}
                    required
                />

                {
                    changeEnv && <>
                        <ProFormText
                            name="deployBaseImage"
                            label="部署所用的镜像环境"
                            required
                        />
                        <ProFormText
                            name="deployFilePairSource"
                            label="编译产物在编译环境中的绝对路径"
                            tooltip="在部署前，会将该路径下的文件拷贝到部署环境中的下面“编译产物在部署环境中的绝对路径”所指定的路径下。"
                        />
                        <ProFormText
                            name="deployFilePairTarget"
                            label="编译产物在部署环境中的绝对路径"
                        />
                    </>
                }

                <ProFormTextArea
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

            </ProForm>
        </>
    )
}

export const getServerSideProps: GetServerSideProps<ExperimentProps> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const client = serverSideCloudapiClient(userInfo.token)
    const loginUser = (await client.getWhoami()).data
    const experimentId = Number(ctx.query.id)
    const experiment = (await client.getExperimentExperimentId(experimentId)).data
    if (loginUser.adminCourses.findIndex((course) => course.id === experiment.course.id) === -1) {
        ctx.res.statusCode = 403
        throw new Error("You are not allowed to access this page")
    }
    return {
        props: {
            userInfo: userInfo,
            experiment: experiment,
        },
    }
}