import { Builder, BuilderList } from "../models/builder"
import { Deployer, DeployerList } from "../models/deployer"
import { ResourcePool } from "../models/resource"
import { k8sCustomObjectsApi } from "./client"
import { createOrUpdate } from "./objects"

const group = "cloudapi.scs.buaa.edu.cn"
const apiVersion = "v1alpha1"
const builderPlural = "builders"
const resourcePoolPlural = "resourcepools"
const deployerPlural = "deployers"

export const imageBuilderClient = {

    get: async (name: string, namespace: string) => {
        return (await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, builderPlural, name)).body as Builder
    },

    list: async (namespace: string) => {
        const data = (await k8sCustomObjectsApi.listNamespacedCustomObject(group, apiVersion, namespace, builderPlural)).body as BuilderList
        return data.items
    },

    createOrUpdate: async (builder: Builder) => {
        return await createOrUpdate(builder, undefined, undefined, undefined, undefined, true)
    }
}

export const deployerClient = {
    get: async (name: string, namespace: string) => {
        return (await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, deployerPlural, name)).body as Deployer
    },

    list: async (namespace: string) => {
        const data = (await k8sCustomObjectsApi.listNamespacedCustomObject(group, apiVersion, namespace, deployerPlural)).body as DeployerList
        return data.items
    },

    createOrUpdate: async (deployer: Deployer) => {
        return await createOrUpdate(deployer, undefined, undefined, undefined, undefined, true)
    },
}

export const resourcePoolsClient = {
    get: async (name: string) => {
        return (await k8sCustomObjectsApi.getClusterCustomObject(group, apiVersion, resourcePoolPlural, name)).body as ResourcePool
    },

    createOrUpdate: async (resourcePool: ResourcePool) => {
        return await createOrUpdate(resourcePool, undefined, undefined, undefined, undefined, true)
    }
}