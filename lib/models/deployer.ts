import * as k8s from '@kubernetes/client-node';
import { BuilderSpec } from './builder';
import { BaseCRDHistory, BaseCRDStatus, crdDisplayStatus } from './crd';

/**
 * Deployer is the Schema for the deployers API
 */
export interface Deployer extends k8s.KubernetesObject {
    /**
     * DeployerSpec defines the desired state of Deployer
     */
    spec: DeployerSpec
    /**
     * DeployerStatus defines the observed state of Deployer
     */
    status?: DeployerStatus
}

export interface DeployerList extends k8s.KubernetesListObject<Deployer> { }

export interface DeployerSpec {
    containers: DeployerContainer[]
    round?: number
    type: "job" | "service"
    resourcePool: string
}

export interface DeployerStatus extends BaseCRDStatus {
    resourcePool: string
}

export interface DeployerContainerPort {
    export?: boolean
    port: number
    protocol?: "tcp" | "udp" | "sctp"
}

export interface DeployerContainer {
    args?: string[]
    command?: string[]
    env?: {
        [k: string]: string
    }
    image: string
    initial?: boolean
    name: string
    ports?: DeployerContainerPort[]
    workingDir?: string
    resource: {
        cpu: number
        memory: number
    }
}

export interface CreateDeployerRequest {
    projectName: string
    name: string
    containers: DeployerContainer[]
    type: "job" | "service"
    resourcePool: string
    setup?: boolean
}

export interface ServiceStatus {
    healthy: boolean
    ports: ServicePort[]
}

export interface ServicePort {
    name: string
    port: number
    nodePort: number
    ip: string
    protocol: string
}

export interface AddDeployerTriggerRequest {
    projectName: string
    deployerName: string
    resourcePool: string
    image?: string
    dynamicImage?: boolean
}

const convertStatus = (status: string) => {
    switch (status.toLocaleLowerCase()) {
        case "undo":
            return '未调度';
        case "pending":
            return "排队中";
        case "doing":
            return "运行中";
        case "done":
            return "成功完成";
        case "failed":
            return "任务失败";
        default:
            return "未知状态";
    }
}

export function deployerDisplayStatus(builder: Deployer): crdDisplayStatus {
    return convertStatus(builder.status?.base?.status ?? "undo");
}

export function deployerHistoryList(deployer: Deployer) {
    return (deployer.status?.base?.historyList ?? ([] as string[])).map(str => {
        const obj = JSON.parse(str)
        obj.status = convertStatus(obj.status ?? obj.Status ?? 'undo')
        return obj as BaseCRDHistory<DeployerSpec>
    }).sort((a, b) => b.round - a.round)
}
