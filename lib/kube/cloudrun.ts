import { Builder, BuilderList } from "../models/builder"
import { Deployer, DeployerList } from "../models/deployer"
import { ResourcePool } from "../models/resource"
import { Workflow, WorkflowList } from "../models/workflow"
import { folonetUnregistry } from "../utils/folonet"
import { k8sCustomObjectsApi } from "./client"
import { createOrUpdate } from "./objects"

const group = "cloudapi.scs.buaa.edu.cn"
const apiVersion = "v1alpha1"
const builderPlural = "builders"
const resourcePoolPlural = "resourcepools"
const deployerPlural = "deployers"
const workflowPlural = "workflows"

type SelectorType = { [key: string]: string | string[]; }

export const imageBuilderClient = {
    get: async (name: string, namespace: string) => {
        return get<Builder>(builderPlural, name, namespace)
    },

    exist: async (name: string, namespace: string) => {
        return exist(builderPlural, name, namespace)
    },

    list: async (namespace: string, selector?: SelectorType) => {
        return (await list<BuilderList>(builderPlural, namespace, selector)).items
    },

    createOrUpdate: async (builder: Builder) => {
        return await createOrUpdate(builder, undefined, undefined, undefined, undefined, true)
    }
}

export const deployerClient = {
    get: async (name: string, namespace: string) => {
        return get<Deployer>(deployerPlural, name, namespace)
    },

    exist: async (name: string, namespace: string) => {
        return exist(deployerPlural, name, namespace)
    },

    list: async (namespace?: string, selector?: SelectorType) => {
        return (await list<DeployerList>(deployerPlural, namespace, selector)).items
    },

    createOrUpdate: async (deployer: Deployer) => {
        return await createOrUpdate(deployer, undefined, undefined, undefined, undefined, true)
    },
}

export const workflowClient = {
    get: async (name: string, namespace: string) => {
        return get<Workflow>(workflowPlural, name, namespace)
    },

    delete: async (name: string, namespace: string) => {
        const workflow = await get<Workflow>(workflowPlural, name, namespace)
        if (workflow) {
            if (workflow.metadata?.labels && workflow.metadata?.labels['checkpoint-id']) {
                await folonetUnregistry(name)
            }
            await k8sCustomObjectsApi.deleteNamespacedCustomObject(group, apiVersion, namespace, workflowPlural, name)
        }
        return workflow
    },

    exist: async (name: string, namespace: string) => {
        return exist(workflowPlural, name, namespace)
    },

    list: async (namespace?: string, selector?: SelectorType) => {
        return (await list<WorkflowList>(workflowPlural, namespace, selector)).items
    },

    deleteMany: async (namespace?: string, selector?: SelectorType) => {
        const workflowList = (await list<WorkflowList>(workflowPlural, namespace, selector)).items
        await Promise.all(workflowList.map(async (workflow) => {
            return await k8sCustomObjectsApi.deleteNamespacedCustomObject(group, apiVersion, workflow.metadata?.namespace!!, workflowPlural, workflow.metadata?.name!!)
        }))
        return workflowList
    },

    createOrUpdate: async (workflow: Workflow) => {
        return await createOrUpdate(workflow, undefined, undefined, undefined, undefined, true)
    }
}

export const resourcePoolsClient = {
    get: async (name: string) => {
        return (await k8sCustomObjectsApi.getClusterCustomObject(group, apiVersion, resourcePoolPlural, name)).body as ResourcePool
    },

    createOrUpdate: async (resourcePool: ResourcePool) => {
        return await createOrUpdate(resourcePool, undefined, undefined, undefined, undefined, true)
    }
}

function parseSelector(selector: SelectorType | undefined): string | undefined {
    return selector ?
        Object.keys(selector).map(key => {
            if (Array.isArray(selector[key])) {
                const value = selector[key] as string[]
                return `${key} in (${value.join(',')})`
            } else {
                const value = selector[key] as string
                return `${key}=${value}`
            }
        }).join(',')
        : undefined
}

async function list<T>(plural: string, namespace?: string, selector?: SelectorType) {
    const selectorStr = parseSelector(selector)
    return namespace ? (await k8sCustomObjectsApi.listNamespacedCustomObject(group, apiVersion, namespace, plural, undefined, undefined, undefined, undefined, selectorStr)).body as T
        : (await k8sCustomObjectsApi.listClusterCustomObject(group, apiVersion, plural, undefined, undefined, undefined, undefined, selectorStr)).body as T
}

async function exist(plural: string, name: string, namespace: string) {
    try {
        await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, plural, name)
        return true
    } catch (e) {
        if ((e as any).statusCode === 404) {
            return false
        }
        throw e
    }
}

async function get<T>(plural: string, name: string, namespace: string) {
    try {
        return (await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, plural, name)).body as T
    } catch (e) {
        if ((e as any).statusCode === 404) {
            return undefined
        }
        throw e
    }
}
