import { Builder } from "../models/builder"
import { k8sCustomObjectsApi } from "./client"

const group = "cloudapi.scs.buaa.edu.cn"
const apiVersion = "v1alpha1"
const builderPlural = "builders"

export const builderClient = {
    
    get:async (name:string, namespace: string) => {
       return (await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, builderPlural, name)).body as Builder
    },

    create: async (builder: Builder) => {
        await k8sCustomObjectsApi.createNamespacedCustomObject(group, apiVersion, builder.metadata?.namespace!!, builderPlural, builder)
    }
}