import globalAxios from 'axios'
import { Configuration, DefaultApiFactory } from '../cloudapi-client'
import { cloudapi } from '../config/env'
import { Builder } from '../models/builder'
import { CreateImageBuilderRequest } from '../models/createImageBuilderRequest'
import { notificationError } from './notification'
import { getToken } from './token'

const cloudviewAxios = globalAxios

cloudviewAxios.interceptors.response.use(
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
    cloudviewAxios
)

export const serverSideCloudapiClient = (token: string) => DefaultApiFactory(
    new Configuration({
        apiKey: token,
        basePath: cloudapi.serverSideEndpoint + "/api/v2"
    }),
    undefined,
    cloudviewAxios
)

const viewApiClientConfig = () => {
    const token = getToken()
    return {
        headers: {
            Authorization: token,
        },
        baseURL: "https://scs.buaa.edu.cn/view/v2/api",
    }
}

export const viewApiClient = {
    createImageBuilder: async (request: CreateImageBuilderRequest) => {
        return (await cloudviewAxios.post('/imageBuilders', request, viewApiClientConfig())).data as Builder[]
    },

    listImageBuilders: async (projectName: string) => {
        return (await cloudviewAxios.get(`/imageBuilders?projectName=${projectName}`, viewApiClientConfig())).data as Builder[]
    },
}