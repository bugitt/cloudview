import { DeployerContainerPort } from "./deployer"
import { Resource } from "./resource"

export interface WorkflowTemplate {
    name: string
    resource: Resource
    baseImage: string
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
}

export interface WorkflowBuildSpec {
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

export type SubmitType = 'zip' | 'git'

export function displaySubmitType(submitType: SubmitType): string {
    switch (submitType) {
        case 'zip':
            return '压缩包'
        case 'git':
            return 'Git'
    }
}

export interface ExperimentWorkflowConfiguration {
    experimentId: number
    submitOptions: SubmitType[]
    resource: Resource
    workflowTemplateName?: string
    baseImage: string
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
        baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
        resource: {
            cpu: 10,
            memory: 100,
        },
        buildSpec: {
            command: "cp -r . /usr/share/nginx/html/"
        },
        deploySpec: {
            changeEnv: false,
            command: `nginx -g 'daemon off;'`,
            ports: [{ port: 80, protocol: 'tcp' }],
        },
    },
]
