import { messageError, messageInfo } from './notification'

export function copyToClipboard(text: string, msg: String) {
    navigator.clipboard.writeText(text).then(
        () => {
            messageInfo(`复制${msg}成功`)
        },
        () => {
            messageError(`复制${msg}失败`)
        }
    )
}
