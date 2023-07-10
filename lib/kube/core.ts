import * as k8s from '@kubernetes/client-node';
import { k8sCoreV1Api } from './client';

export const listPods = async (namespace: string, selector?: string) => {
    return (await k8sCoreV1Api.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, selector)).body.items as k8s.V1Pod[];
}

export const listAllNS = async () => {
    return ((await k8sCoreV1Api.listNamespace()).body.items as k8s.V1Namespace[]).map(it => it.metadata!!.name!!)
}

export const listServices = async (namespace: string, selector?: string) => {
    return (await k8sCoreV1Api.listNamespacedService(namespace, undefined, undefined, undefined, undefined, selector)).body.items as k8s.V1Service[];
}
