import globalAxios from 'axios'
import { Configuration, DefaultApiFactory } from '../cloudapi-client'
import { notificationError } from './notification'

const cloudapiAxios = globalAxios

cloudapiAxios.interceptors.response.use(
    response => response,
    error => {
        const statusCode = error.response?.status
        if (statusCode === 401 || statusCode === 403) {
            error.message = '登录已过期，请重新登录'
            notificationError(error, '登录过期')
        }
        throw error
    }
)

export const cloudapiClient = (token: string, url?: string) => DefaultApiFactory(
    new Configuration({
        apiKey: token,
        basePath: (url ?? 'http://localhost:9999') + '/api/v2'
    }),
    undefined,
    cloudapiAxios
)
