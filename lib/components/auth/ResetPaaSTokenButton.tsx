import { Button, Popconfirm } from "antd";
import { copyToClipboard } from "../../utils/clipboard";
import { cloudapiClient } from "../../utils/cloudapi";
import { notificationError } from "../../utils/notification";
import { randomStringStrongWithCapital } from "../../utils/random";

export function ResetPaaSTokenButton() {
    async function onClick() {
        try {
            const newToken = randomStringStrongWithCapital(15)
            await cloudapiClient.putPaasToken({ paasToken: newToken })
            copyToClipboard(newToken, '新的PaaS平台通用Token')
        } catch (e) {
            notificationError("重置PaaS平台通用Token失败")
        }
    }
    return (
        <Popconfirm
            title='重置PaaS平台通用Token'
            description="确定要重置PaaS平台通用Token吗？"
            onConfirm={onClick}
        >
            <Button type='primary' >
                点击重置
            </Button>
        </Popconfirm>
    )
}