import { ModalForm, ProFormSelect, ProFormText } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Button } from "antd"
import { viewApiClient } from "../../../utils/cloudapi"
import { messageSuccess, notificationError } from "../../../utils/notification"
import { getResourcePoolListObj } from "./AddDeployerForm"

interface RerunDeployerButtonProps {
    deployerName: string
    projectName: string
    projectId: number
    hook(): void
    image?: string
}

export const RerunDeployerButton = (props: RerunDeployerButtonProps) => {
    const { deployerName, projectName, projectId } = props
    const { data: resourcePoolList, error } = useRequest(() => viewApiClient.getProjectResourcePools(projectId))
    notificationError(error)
    return (<>
        <ModalForm
            title="手动启动部署任务"
            width={500}
            trigger={<Button type="primary">手动启动部署任务</Button>}
            onFinish={async (values) => {
                const image = values.image ? values.image as string : props.image
                if (!values.resourcePool) {
                    notificationError("请选择资源池")
                    return false
                }
                const resourcePool = values.resourcePool as string
                try {
                    await viewApiClient.rerunDeployer(deployerName, projectName, resourcePool, image)
                    messageSuccess("提交容器部署任务成功")
                    props.hook()
                    return true
                } catch (e) {
                    notificationError("提交容器部署任务失败")
                    return false
                }
            }}
        >
            <ProFormText
                label="请确认使用的镜像"
                name="image"
                initialValue={props.image}
                required
            />
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
        </ModalForm>
    </>)
}