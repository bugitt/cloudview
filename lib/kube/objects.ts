import * as k8s from '@kubernetes/client-node';
import { k8sObjectApi } from './client';

export const createOrUpdate = async<T extends k8s.KubernetesObject | k8s.KubernetesObject> (obj: T, apiVersion?: string, kind?: string, name?: string, namespace?: string) => {
    if (apiVersion) {
        obj.apiVersion = apiVersion
    }
    if (kind) {
        obj.kind = kind
    }
    if (name || namespace) {
        if (!obj.metadata) {
            obj.metadata = {}
        }
        obj.metadata.name = name || obj.metadata.name!!
        obj.metadata.namespace = namespace || obj.metadata.namespace!!
    }
    try {
        // @ts-ignore
        await k8sObjectApi.read(obj);
        return (await k8sObjectApi.patch(obj)).body;
    } catch (_) {
        return (await k8sObjectApi.create(obj)).body;
    }
}
