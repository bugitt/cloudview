import * as k8s from '@kubernetes/client-node';
import { BaseCRDStatus } from './crd';

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

export interface DeployerContainer {
    args?: string[]
    command?: string[]
    env?: {
        [k: string]: string
    }
    image: string
    initial?: boolean
    name: string
    ports?: {
        export?: boolean
        port: number
        protocol?: "tcp" | "udp" | "sctp"
    }[]
    resource: {
        cpu: number
        memory: number
    }
}
