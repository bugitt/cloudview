import globalAxios from 'axios'
import { NextApiRequest } from 'next'
import { Configuration, DefaultApiFactory } from '../cloudapi-client'
import { cloudapi } from '../config/env'
import { Builder, CreateImageBuilderRequest } from '../models/builder'
import { AddDeployerTriggerRequest, CreateDeployerRequest, Deployer, ServiceStatus } from '../models/deployer'
import { ResourcePool } from '../models/resource'
import { CreateWorkflowRequest, UpdateWorkflowRequest, Workflow, WorkflowDisplayStatus, WorkflowResponse, WorkflowTemplate } from '../models/workflow'
import { notificationError } from './notification'
import { getToken, getTokenFromReq } from './token'
import * as k8s from '@kubernetes/client-node';

const cloudviewAxios = globalAxios

export type CloudapiClientType = ReturnType<typeof DefaultApiFactory>

cloudviewAxios.interceptors.response.use(
    response => response,
    error => {
        if (typeof window === 'undefined') {
            console.error(error)
        }
        const statusCode = error.response?.status
        if (statusCode === 401 || statusCode === 403) {
            error.message = '登录已过期，请重新登录'
            try {
                notificationError(error, '登录过期')
            } catch (_) {
            }
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

export const serverSideCloudapiClient = (token?: string, req?: NextApiRequest) => {
    let finalToken = token
    if (!finalToken && req) {
        finalToken = getTokenFromReq(req)
    }
    return DefaultApiFactory(
        new Configuration({
            apiKey: finalToken,
            basePath: cloudapi.serverSideEndpoint + "/api/v2"
        }),
        undefined,
        cloudviewAxios
    )
}

const viewApiClientConfig = (data?: any) => {
    const token = getToken()
    return {
        headers: {
            Authorization: token,
        },
        data: data,
        baseURL: "/view/v2/api",
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

    addDeployerHook: async (name: string, req: AddDeployerTriggerRequest) => {
        return (await cloudviewAxios.post(`/imageBuilder/${name}/addDeployerHook`, req, viewApiClientConfig())).data as Builder
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
    },

    getWorkflowTemplates: async () => {
        return (await cloudviewAxios.get(`/workflows/templates`, viewApiClientConfig())).data as WorkflowTemplate[]
    },

    createWorkflow: async (request: CreateWorkflowRequest) => {
        return (await cloudviewAxios.post('/workflows', request, viewApiClientConfig())).data as Workflow[]
    },

    updateWorkflow: async (request: UpdateWorkflowRequest) => {
        return (await cloudviewAxios.patch('/workflows', request, viewApiClientConfig())).data as Workflow[]
    },

    listWorkflows: async (projectName: string, tag?: string) => {
        const params = new URLSearchParams()
        params.append('projectName', projectName)
        if (tag) {
            params.append('tag', tag)
        }
        return (await cloudviewAxios.get(`/workflows?${params.toString()}`, viewApiClientConfig())).data as Workflow[]
    },

    listWorkflowsByExperiment: async (expId: number, tag?: string, studentIdList?: string[]) => {
        const params = new URLSearchParams()
        if (tag) {
            params.append('tag', tag)
        }
        if (studentIdList && studentIdList.length > 0) {
            params.append('studentIdList', studentIdList.join(','))
        }
        return (await cloudviewAxios.get(`/experiment/${expId}/workflows?${params.toString()}`, viewApiClientConfig())).data as Workflow[]
    },

    deleteWorkflowsByExperiment: async (expId: number, tag?: string, studentIdList?: string[]) => {
        const params = new URLSearchParams()
        if (tag) {
            params.append('tag', tag)
        }
        if (studentIdList && studentIdList.length > 0) {
            params.append('studentIdList', studentIdList.join(','))
        }
        return (await cloudviewAxios.delete(`/experiment/${expId}/workflows?${params.toString()}`, viewApiClientConfig())).data as Workflow[]
    },

    listWorkflowResponses: async (projectName: string, tag?: string) => {
        const params = new URLSearchParams()
        params.append('projectName', projectName)
        if (tag) {
            params.append('tag', tag)
        }
        return (await cloudviewAxios.get(`/workflowResponses?${params.toString()}`, viewApiClientConfig())).data as WorkflowResponse[]
    },

    listWorkflowResponsesByExperiment: async (expId: number, tag?: string, studentIdList?: string[]) => {
        const params = new URLSearchParams()
        if (tag) {
            params.append('tag', tag)
        }
        if (studentIdList && studentIdList.length > 0) {
            params.append('studentIdList', studentIdList.join(','))
        }
        return (await cloudviewAxios.get(`/experiment/${expId}/workflowResponses?${params.toString()}`, viewApiClientConfig())).data as WorkflowResponse[]
    },

    getWorkflow: async (name: string, projectName: string) => {
        return (await cloudviewAxios.get(`/workflow/${name}?projectName=${projectName}`, viewApiClientConfig())).data as Workflow
    },

    deleteWorkflow: async (name: string, projectName: string) => {
        return (await cloudviewAxios.delete(`/workflow/${name}?projectName=${projectName}`, viewApiClientConfig())).data as Workflow
    },

    rerunWorkflow: async (name: string, projectName: string) => {
        return (await cloudviewAxios.post(`/workflow/${name}/rerun?projectName=${projectName}`, undefined, viewApiClientConfig())).data as Workflow
    },

    getWorkflowDisplayStatus: async (name: string, projectName: string) => {
        return (await cloudviewAxios.get(`/workflow/${name}/displayStatus?projectName=${projectName}`, viewApiClientConfig())).data as WorkflowDisplayStatus
    },

    getPodListByNamespace: async (ns: string) => {
        return (await cloudviewAxios.get(`/kube/${ns}/podList`, viewApiClientConfig())).data as k8s.V1PodList
    },

    updateKubeObject: async (obj: k8s.KubernetesObject) => {
        return (await cloudviewAxios.put(`/kube/object`, obj, viewApiClientConfig())).data as k8s.KubernetesObject
    },

    deleteKubeObject: async (obj: k8s.KubernetesObject) => {
        return (await cloudviewAxios.delete(`/kube/object`, viewApiClientConfig(obj))).data as k8s.KubernetesObject
    },

    getKubeNodeList: async () => {
        return (await cloudviewAxios.get(`/kube/nodeList`, viewApiClientConfig())).data as k8s.V1NodeList
    },
}
