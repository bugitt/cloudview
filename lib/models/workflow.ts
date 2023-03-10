import { ProFormInstance } from '@ant-design/pro-components';
import * as k8s from '@kubernetes/client-node';
import React, { MutableRefObject } from 'react';
import { ExperimentResponse, ExperimentWorkflowConfigurationResponse } from '../cloudapi-client';
import { workflowTemplates } from '../components/workflow/workflowTemplates';
import { viewApiClient } from '../utils/cloudapi';
import { messageSuccess, notificationError, notificationSuccess } from '../utils/notification';
import { Builder, BuilderContext } from './builder';
import { BaseCRDStatus } from './crd';
import { Deployer, DeployerContainerPort, ServicePort, ServiceStatus } from "./deployer"
import { Resource } from "./resource"

export const crdWorkflowKind = "Workflow";

export interface Workflow extends k8s.KubernetesObject {
    /**
     * BuilderSpec defines the desired state of Builder
     */
    spec: WorkflowSpec
    /**
     * BuilderStatus defines the observed state of Builder
     */
    status?: WorkflowStatus
}

export interface WorkflowList extends k8s.KubernetesListObject<Workflow> { }

export type WorkflowStage = 'Pending' | 'Building' | 'Deploying' | 'Serving' | 'Unknown'

export interface WorkflowStatus extends BaseCRDStatus {
    stage?: WorkflowStage
}

export interface WorkflowSpec {
    build?: {
        baseImage: string
        command?: string
        context: BuilderContext
        pushSecretName?: string
        registryLocation: string
        workingDir?: string
    }
    deploy: {
        baseImage?: string
        changeEnv?: boolean
        command?: string
        filePair?: {
            source: string
            target: string
        }
        ports?: DeployerContainerPort[]
        resource: Resource
        resourcePool: string
        type: "job" | "service"
        workingDir?: string
        env?: { [k: string]: string }
    }
    round?: number
}

export const getWorkflowOwner = (wf: Workflow) => {
    return wf.metadata?.labels?.owner
}

export const getWorkflowExpId = (wf: Workflow) => {
    const expId = wf.metadata?.labels?.expId
    return expId ? parseInt(expId) : undefined
}

export const getWorkflowTag = (wf: Workflow) => {
    return wf.metadata?.labels?.tag
}

export const getWorkflowName = (wf?: Workflow) => {
    return wf?.metadata?.name
}

export const getWorkflowTemplate = (wf?: Workflow) => {
    const key = wf?.metadata?.labels?.templateKey
    return workflowTemplates.find(t => t.key === key)
}

export const getWorkflowNamespace = (wf?: Workflow) => {
    return wf?.metadata?.namespace
}

export function getWfConfigRespTag(wfConfigResp: ExperimentWorkflowConfigurationResponse) {
    return wfConfigResp.needSubmit ? 'submit' : String(wfConfigResp.id)
}

export interface WorkflowDisplayStatus {
    display: String // 友好易读的状态描述
    stage: 'Pending' | 'Building' | 'Deploying' | 'Serving' | 'Doing' | 'Done' | 'Unknown' // 当前处于什么阶段
    status: 'Process' | 'Success' | 'Error'  // 当前该阶段的状态
    builder?: Builder
    deployer?: Deployer
}

export interface CreateWorkflowRequest {
    ownerIdList: string[]
    tag: string
    expId: number
    context?: BuilderContext
    baseImage: string
    compileCommand?: string
    deployCommand?: string
    confRespId: number
    templateKey: string
    env?: { [k: string]: string }
    ports?: DeployerContainerPort[]
}

export interface UpdateWorkflowRequest extends CreateWorkflowRequest {
    workflowName: string
}

export interface ServiceStatusListItem {
    title: React.ReactNode
    description: React.ReactNode
    disableAutoConnect?: boolean
}

export interface WorkflowTemplate {
    key: string
    name: string
    resource: Resource
    baseImage: string
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
    extraFormItems?: React.ReactNode
    decorate?: (wfConfig: ExperimentWorkflowConfiguration, values: any) => ExperimentWorkflowConfiguration
    setFormFields?: (wfConfig: ExperimentWorkflowConfiguration, formRef?: MutableRefObject<ProFormInstance<any> | undefined>) => void
    getServiceStatusListItemByPort?: (port: ServicePort, wf: Workflow) => ServiceStatusListItem | undefined
}

export interface WorkflowBuildSpec {
    command: string
}

export interface WorkflowDeploySpec {
    changeEnv: boolean
    baseImage?: string
    filePair?: FilePair
    command?: string
    env?: { [k: string]: string }
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
    needSubmit?: boolean // default true
    experimentId: number
    submitOptions: SubmitType[]
    resource: Resource
    workflowTemplateName?: string
    baseImage: string
    buildSpec?: WorkflowBuildSpec
    deploySpec: WorkflowDeploySpec
    isJob?: boolean
    customOptions: {
        baseImage: boolean
        compileCommand: boolean
        deployCommand: boolean
        ports: boolean
    }
}

export interface WorkflowResponse {
    workflow: Workflow
    displayStatus?: WorkflowDisplayStatus
    serviceStatus?: ServiceStatus
}


export async function setupWorkflow(wfConfigResp: ExperimentWorkflowConfigurationResponse, expId: number, ownerIdList: string[], context?: BuilderContext, oldWorkflow?: Workflow) {
    const wfConfig = JSON.parse(wfConfigResp.configuration) as ExperimentWorkflowConfiguration
    const wfTemplate = workflowTemplates.find(wf => wf.name === wfConfig.workflowTemplateName)
    const req: CreateWorkflowRequest = {
        confRespId: wfConfigResp.id,
        ownerIdList: ownerIdList,
        tag: getWfConfigRespTag(wfConfigResp),
        expId: expId,
        context: context,
        baseImage: wfConfig.baseImage,
        templateKey: wfTemplate?.key ?? 'custom',
        compileCommand: wfConfig.buildSpec?.command,
        deployCommand: wfConfig.deploySpec?.command,
        ports: wfConfig.deploySpec.ports,
        env: wfConfig.deploySpec.env,
    }

    try {
        if (oldWorkflow) {
            const updateReq: UpdateWorkflowRequest = {
                workflowName: oldWorkflow?.metadata?.name!!,
                ...req
            }
            await viewApiClient.updateWorkflow(updateReq)
        } else {
            await viewApiClient.createWorkflow(req)
        }
        notificationSuccess('成功提交任务')
        return true
    } catch (_) {
        notificationError('提交失败')
        return false
    }
}
