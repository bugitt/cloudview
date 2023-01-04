import globalAxios from 'axios'
import { Configuration, DefaultApiFactory } from '../cloudapi-client'
import { cloudapi } from '../config/env'
import { notificationError } from './notification'
import { getToken } from './token'

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
        apiKey: () => getToken()
    }),
    undefined,
    cloudapiAxios
)

export const serverSideCloudapiClient = (token: string) => DefaultApiFactory(
    new Configuration({
        apiKey: token,
        basePath: cloudapi.serverSideEndpoint + "/api/v2"
    }),
    undefined,
    cloudapiAxios
)