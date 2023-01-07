import globalAxios from 'axios'
import { Configuration, DefaultApiFactory } from '../cloudapi-client'
import { cloudapi } from '../config/env'
import { Builder, CreateImageBuilderRequest } from '../models/builder'
import { CreateDeployerRequest, Deployer, ServiceStatus } from '../models/deployer'
import { ResourcePool } from '../models/resource'
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

    getImageBuilder: async (name: string, projectName: string) => {
        return (await cloudviewAxios.get(`/imageBuilder/${name}?projectName=${projectName}`, viewApiClientConfig())).data as Builder
    },

    rerunImageBuilder: async (name: string, projectName: string, tag?: string) => {
        return (await cloudviewAxios.post(`/imageBuilder/${name}/rerun?projectName=${projectName}&tag=${tag}`, undefined, viewApiClientConfig())).data as Builder
    },

    addTriggerDeployer: async (name: string, projectName: string, deployerName: string, image: string, resourcePool: string) => {
        return (await cloudviewAxios.post(`/imageBuilder/${name}/triggerDeployer?projectName=${projectName}&deployerName=${deployerName}&image=${image}&resourcePool=${resourcePool}`, undefined, viewApiClientConfig())).data as Builder
    },

    createDeployer: async (request: CreateDeployerRequest) => {
        return (await cloudviewAxios.post('/deployers', request, viewApiClientConfig())).data as Deployer[]
    },

    listDeployers: async (projectName: string) => {
        return (await cloudviewAxios.get(`/deployers?projectName=${projectName}`, viewApiClientConfig())).data as Deployer[]
    },

    getDeployer: async (name: string, projectName: string) => {
        return (await cloudviewAxios.get(`/deployer/${name}?projectName=${projectName}`, viewApiClientConfig())).data as Deployer
    },

    rerunDeployer: async (name: string, projectName: string, resourcePool?: string, image?: string) => {
        return (await cloudviewAxios.post(`/deployer/${name}/rerun?projectName=${projectName}&resourcePool=${resourcePool}&image=${image}`, undefined, viewApiClientConfig())).data as Deployer
    },

    getServiceStatus: async (name: string, projectName: string) => {
        return (await cloudviewAxios.get(`/deployer/${name}/serviceStatus?projectName=${projectName}`, viewApiClientConfig())).data as ServiceStatus
    },

    getProjectResourcePools: async (projectId: number) => {
        return (await cloudviewAxios.get(`/resourcePools?projectId=${projectId}`, viewApiClientConfig())).data as ResourcePool[]
    }
}