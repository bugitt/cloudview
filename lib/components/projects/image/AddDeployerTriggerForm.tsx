import { ProForm, ProFormText, ProFormSelect, ProFormSwitch } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { useEffect, useState } from "react"
import { Project } from "../../../cloudapi-client"
import { Builder } from "../../../models/builder"
import { AddDeployerTriggerRequest, Deployer } from "../../../models/deployer"
import { ResourcePool } from "../../../models/resource"
import { viewApiClient } from "../../../utils/cloudapi"
import { messageSuccess, notificationError } from "../../../utils/notification"
import { getResourcePoolListObj } from "../deployer/AddDeployerForm"

interface FormDataType {
    resourcePool: string
    image?: string
    dynamicImage?: boolean
}

export function AddDeployerTriggerForm(props: {
    builder?: Builder
    deployer?: Deployer
    project: Project
    open: boolean
    hook(): void
}) {
    const { project, deployer, builder } = props
    const [resourcePoolList, setResourceList] = useState<ResourcePool[]>([])
    const resourcePoolReq = useRequest(() => viewApiClient.getProjectResourcePools(project.id), {
        onSuccess: (data) => {
            setResourceList(data)
        },
        onError: (_) => {
            notificationError('获取项目资源池列表失败')
        }
    })

    const originalImage = deployer?.spec.containers[0]?.image || ""

    const [dynamicImage, setDynamicImage] = useState(false)

    return (
        <>
            <ProForm<FormDataType>
                title="手动启动部署任务"
                onFinish={async (values: FormDataType) => {
                    const resourcePool = values.resourcePool as string
                    try {
                        const req: AddDeployerTriggerRequest = {
                            projectName: project.name,
                            deployerName: deployer?.metadata?.name!!,
                            resourcePool: resourcePool,
                            image: values.image,
                            dynamicImage: values.dynamicImage
                        }
                        await viewApiClient.addDeployerHook(builder?.metadata?.name!!, req)
                        messageSuccess("添加触发器成功")
                        props.hook()
                        resourcePoolReq.run()
                        return true
                    } catch (e) {
                        notificationError("添加触发器失败")
                        return false
                    }
                }}
            >
                <ProFormSelect
                    name="resourcePool"
                    label="资源池"
                    valueEnum={getResourcePoolListObj(resourcePoolList || [])}
                    placeholder="请选择资源池"
                    width={350}
                    rules={[
                        {
                            required: true,
                            message: '如需启动服务，必须指定资源池'
                        }
                    ]}
                />
                <ProFormSwitch
                    label='是否动态修改部署任务所使用的镜像？'
                    name='dynamicImage'
                    checkedChildren='是'
                    unCheckedChildren='否'
                    extra='如果选择“是”，那么每次触发部署任务时，都将使用镜像构建任务产生的新镜像'
                    fieldProps={{
                        onChange: (checked: boolean) => {
                            setDynamicImage(checked)
                        }
                    }}
                />

                {!dynamicImage && <ProFormText
                    label="请确认使用的镜像"
                    name="image"
                    initialValue={originalImage}
                    required
                />}
            </ProForm>
        </>
    )
}