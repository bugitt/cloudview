import { message, notification } from 'antd'
import axios, { AxiosError } from 'axios'

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

const authErrorKey = 'authError'

export function notificationError(
    error: string | Error | undefined,
    title?: string
) {
    if (!error) return
    let finalTitle = title ?? '错误'
    let msg =
        error instanceof Error
            ? ((error as AxiosError)?.response?.data as string) ?? error.message
            : error
    let key: undefined | string = undefined
    let duration: undefined | number = undefined
    if (axios.isAxiosError(error) && error.response) {
        const status = (error as AxiosError)?.response?.status
        if (status === 401 || status === 403) {
            key = authErrorKey
            duration = 0
            finalTitle = '登录过期'
            msg = '登录已过期，请重新登录'
        }
    }
    notification['error']({
        duration: duration,
        key: key,
        message: finalTitle,
        description: msg
    })
}
