import { Builder } from "../models/builder"
import { k8sCustomObjectsApi } from "./client"
import { createOrUpdate } from "./objects"

const group = "cloudapi.scs.buaa.edu.cn"
const apiVersion = "v1alpha1"
const builderPlural = "builders"

export const imageBuilderClient = {
    
    get:async (name:string, namespace: string) => {
       return (await k8sCustomObjectsApi.getNamespacedCustomObject(group, apiVersion, namespace, builderPlural, name)).body as Builder
    },

    createOrUpdate: async (builder: Builder) => {
        // return (await k8sCustomObjectsApi.createNamespacedCustomObject(group, apiVersion, builder.metadata?.namespace!!, builderPlural, builder)).body as Builder
        return (await createOrUpdate(builder)) as Builder
    }
}