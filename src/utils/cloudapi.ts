import { Configuration, DefaultApiFactory } from '../cloudapi-client'
import { getToken } from './token'
import globalAxios from 'axios'
import { notificationError } from './message'

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

export const cloudapiClient = DefaultApiFactory(
    new Configuration({
        apiKey: (name: string) => {
            if (name === 'Authorization') {
                return getToken()
            }
            return ''
        }
    }),
    undefined,
    cloudapiAxios
)
