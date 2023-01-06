import { Builder, BuilderList } from "../models/builder"
import { k8sCustomObjectsApi } from "./client"
import { createOrUpdate } from "./objects"

const group = "cloudapi.scs.buaa.edu.cn"
const apiVersion = "v1alpha1"
const builderPlural = "builders"

export const imageBuilderClient = {

    get: async (name: string, namespace: string) => {
        return (await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, builderPlural, name)).body as Builder
    },

    list: async (namespace: string) => {
        const data = (await k8sCustomObjectsApi.listNamespacedCustomObject(group, apiVersion, namespace, builderPlural)).body as BuilderList
        return data.items
    },

    createOrUpdate: async (builder: Builder) => {
        return (await createOrUpdate(builder)) as Builder
    }
}