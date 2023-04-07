import { messageError, messageInfo } from './notification'

export function copyToClipboard(text: string, msg: String) {
    navigator.clipboard.writeText(text).then(
        () => {
            messageInfo(`${msg}已成功复制到剪贴板`)
        },
        () => {
            messageError(`复制${msg}到剪贴板失败`)
        }
    )
}
