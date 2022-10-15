import { message } from 'antd'
import { AxiosError } from 'axios'

export function messageError(error: string | Error | undefined) {
    if (!error) return
    const msg =
        error instanceof Error
            ? ((error as AxiosError)?.response?.data as string) ?? error.message
            : error
    message.error(msg).then()
}

export function messageInfo(msg: string) {
    message.info(msg).then()
}

export function messageSuccess(msg: string) {
    message.success(msg).then()
}
