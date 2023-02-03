import * as k8s from '@kubernetes/client-node';
import { imageBuilder } from '../config/env';
import { createOrUpdate } from '../kube/objects';

export const ensurePushSecret = async (namespace: string) => {
    const secret: k8s.V1Secret = {
        metadata: {
            name: imageBuilder.pushSecretName,
            namespace: namespace,
        },
        type: "kubernetes.io/dockerconfigjson",
        data: {
            ".dockerconfigjson": imageBuilder.dockerconfigjson
        },
    }
    await createOrUpdate(secret, "v1", "Secret")
}
