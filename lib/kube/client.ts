import * as k8s from '@kubernetes/client-node';
import { businessK8s } from '../config/env';

const cluster = {
    name: 'business-cluster',
    server: businessK8s.server,
    caData: businessK8s.clusterCaData,
};

const user = {
    name: 'business-rke',
    token: businessK8s.userToken,
    certData: businessK8s.userCertData,
    keyData: businessK8s.userKeyData,
};

const context = {
    name: 'business-rke',
    user: user.name,
    cluster: cluster.name,
};

const kc = new k8s.KubeConfig();
kc.loadFromOptions({
    clusters: [cluster],
    users: [user],
    contexts: [context],
    currentContext: context.name,
});

export const k8sCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);

export const k8sCustomObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

export const k8sObjectApi = k8s.KubernetesObjectApi.makeApiClient(kc);