import { ModalForm, ProFormText } from "@ant-design/pro-components"
import { Button } from "antd"
import { viewApiClient } from "../../../utils/cloudapi"
import { messageSuccess, notificationError } from "../../../utils/notification"

interface RerunImageBuilderButtonProps {
    builderName: string
    projectName: string
    hook(): void
    tag?: string
}

export const RerunImageBuilderButton = (props: RerunImageBuilderButtonProps) => {
    const { builderName, projectName } = props
    return (<>
        <ModalForm
            title="手动执行构建"
            width={500}
            trigger={<Button type="primary">手动执行构建</Button>}
            onFinish={async (values) => {
                const tag = values.tag ? values.tag as string : props.tag
                try {
                    await viewApiClient.rerunImageBuilder(builderName, projectName, tag)
                    messageSuccess("提交镜像构建任务成功")
                    props.hook()
                    return true
                } catch (e) {
                    notificationError("提交镜像构建任务失败")
                    return false
                }
            }}
        >
            <ProFormText
                label="请确认新任务的镜像标签"
                name="tag"
                initialValue={props.tag}
                required
            />
        </ModalForm>
    </>)
}