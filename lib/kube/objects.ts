import * as k8s from '@kubernetes/client-node';
import { k8sObjectApi } from './client';

 function getObjectHeader(obj: k8s.KubernetesObject) {
    return {
        metadata: {
            name: obj.metadata?.name!!,
            namespace: obj.metadata?.namespace!!,
        }
    }
}

export const createOrUpdate = async (obj:k8s.KubernetesObject) => {
    try {
        await k8sObjectApi.read(getObjectHeader(obj));
        return (await k8sObjectApi.patch(obj)).body;
    } catch (error) {
        return (await k8sObjectApi.create(obj)).body;
    }
}
