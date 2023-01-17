import { DeployerContainerPort } from "./deployer"

export interface WorkflowTemplate {
    name: string
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
}

export interface WorkflowBuildSpec {
    baseImage: string
    workingDir: string
    command: string
}

export interface WorkflowDeploySpec {
    changeEnv: boolean
    baseImage?: string
    filePair?: FilePair
    command?: string
    ports?: DeployerContainerPort[]
}

export interface FilePair {
    source: string
    target: string
}

export interface EnableExperimentPaasRequest {
    experimentId: number
    workflowTemplateName: string
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
}

export const workflowTemplates: WorkflowTemplate[] = [
    {
        name: '静态网站（Nginx）',
        buildSpec: {
            baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
            workingDir: './',
            command: `copy -r ./* /usr/share/nginx/html/`,
        },
        deploySpec: {
            changeEnv: false,
            command: `nginx -g 'daemon off;'`,
            ports: [{ port: 80, protocol: 'tcp' }],
        },
    },
    {
        name: `静态网站（Nginx）（change env）`,
        buildSpec: {
            baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
            workingDir: './',
            command: `copy -r ./* /usr/share/nginx/html/`,
        },
        deploySpec: {
            changeEnv: true,
            baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
            filePair: {
                source: '/usr/share/nginx/html',
                target: '/usr/share/nginx/html',
            },
            command: `nginx -g 'daemon off;'`,
            ports: [{ port: 80, protocol: 'tcp' }],
        },
    },
    {
        name: `静态网站（Nginx）（don't need compile）`,
        deploySpec: {
            changeEnv: true,
            baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
            filePair: {
                source: '/usr/share/nginx/html',
                target: '/usr/share/nginx/html',
            },
            command: `nginx -g 'daemon off;'`,
            ports: [{ port: 80, protocol: 'tcp' }],
        },
    }
]
