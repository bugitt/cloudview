import * as k8s from '@kubernetes/client-node';
import { NamespacedName } from './crd';

export interface ResourcePool extends k8s.KubernetesObject {
    spec: ResourcePoolSpec
}

export interface ResourcePoolSpec {
    capacity: Resource
    free: Resource
    usage: ResourceUsage[]
}

export interface Resource {
    cpu: number
    memory: number
}

export interface ResourceUsage {
    resource: Resource
    typeMeta: {
        apiVersion: string
        kind: string
    }
    namespacedName: NamespacedName
}