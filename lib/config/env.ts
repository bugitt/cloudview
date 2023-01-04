// for business kubernetes cluster
export const businessK8s = {
    server: process.env.BUSINESS_K8S_SERVER,
    userToken: process.env.BUSINESS_K8S_USER_TOKEN,
}

// for cloudapi
export const cloudapi = {
    serverSideEndpoint: process.env.CLOUDAPI_SERVER_SIDE_ENDPOINT,
}