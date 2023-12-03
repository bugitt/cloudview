// for business kubernetes cluster
export const businessK8s = {
    server: process.env.BUSINESS_K8S_SERVER,
    userToken: process.env.BUSINESS_K8S_USER_TOKEN,
    clusterCaData: process.env.BUSINESS_K8S_CLUSTER_CA_DATA,
    userCertData: process.env.BUSINESS_K8S_USER_CERT_DATA,
    userKeyData: process.env.BUSINESS_K8S_USER_KEY_DATA,
}

// for cloudapi
export const cloudapi = {
    serverSideEndpoint: process.env.CLOUDAPI_SERVER_SIDE_ENDPOINT,
}

// for image builder
export const imageBuilder = {
    s3: {
        endpoint: process.env.IMAGE_BUILDER_S3_ENDPOINT,
        accessKeyID: process.env.IMAGE_BUILDER_S3_ACCESS_KEY_ID,
        accessSecretKey: process.env.IMAGE_BUILDER_S3_ACCESS_SECRET_KEY,
        bucket: process.env.IMAGE_BUILDER_S3_BUCKET,
        region: process.env.IMAGE_BUILDER_S3_REGION,
    },
    imageRegistry: process.env.IMAGE_BUILDER_IMAGE_REGISTRY!!,
    pushSecretName: process.env.IMAGE_BUILDER_PUSH_SECRET_NAME ?? "push-secret",
    dockerconfigjson: process.env.IMAGE_BUILDER_DOCKERCONFIGJSON ?? "",
}

// for deployer
export const deployerConfig = {
    externalIp: process.env.DEPLOYER_EXTERNAL_IP,
}