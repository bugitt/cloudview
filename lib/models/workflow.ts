import { DeployerContainerPort } from "./deployer"
import { Resource } from "./resource"

export interface WorkflowTemplate {
    name: string
    resource: Resource
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
}

export interface WorkflowBuildSpec {
    baseImage: string
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

export interface ExperimentWorkflowConfiguration {
    experimentId: number
    resource: Resource
    workflowTemplateName: string
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
    customOptions: {
        baseImage: boolean
        compileCommand: boolean
        deployCommand: boolean
        ports: boolean
    }
}

export const workflowTemplates: WorkflowTemplate[] = [
    {
        name: '静态网站（Nginx）',
        resource: {
            cpu: 10,
            memory: 100,
        },
        buildSpec: {
            baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
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
        resource: {
            cpu: 10,
            memory: 100,
        },
        buildSpec: {
            baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
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
        resource: {
            cpu: 10,
            memory: 100,
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
    }
]
