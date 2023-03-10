import { Workflow, WorkflowResponse } from "../../models/workflow";
import { create } from "zustand";
import { viewApiClient } from "../../utils/cloudapi";

export interface WorkflowMapState {
    workflowMap: Map<string, Workflow>
    loading: boolean
    getWorkflow: (name?: string, namespace?: string) => Workflow | undefined
    refreshWorkflowMapByExpIdAndTag: (expId: number, tag: string, studentIdList?: string[]) => Promise<WorkflowResponse[]>
    refreshWorkflowMapByProjectNameAndTag: (projectName: string, tag: string) => Promise<void>
    updateSingleWorkflow: (workflow?: Workflow) => void
}

const workflowKey = (workflow: Workflow) => `${workflow.metadata?.namespace},${workflow.metadata?.name}`

export const useWorkflowStore = create<WorkflowMapState>()((set, get) => ({
    workflowMap: new Map<string, Workflow>(),
    loading: false,
    getWorkflow: (name?: string, namespace?: string) => {
        if (!name || !namespace) {
            return undefined
        }
        return get().workflowMap.get(`${namespace},${name}`)
    },
    refreshWorkflowMapByExpIdAndTag: async (expId: number, tag: string, studentIdList?: string[]) => {
        set({ loading: true })
        const workflowRespList = await viewApiClient.listWorkflowResponsesByExperiment(expId, tag, studentIdList)
        const newMap = new Map<string, Workflow>()
        workflowRespList.forEach(workflowResp => {
            newMap.set(workflowKey(workflowResp.workflow), workflowResp.workflow)
        })
        set({ workflowMap: newMap, loading: false })
        return workflowRespList
    },
    refreshWorkflowMapByProjectNameAndTag: async (projectName: string, tag: string) => {
        set({ loading: true })
        const workflowList = await viewApiClient.listWorkflows(projectName, tag)
        const newMap = new Map<string, Workflow>()
        workflowList.forEach(workflow => {
            newMap.set(workflowKey(workflow), workflow)
        })
        set({ workflowMap: newMap, loading: false })
    },
    updateSingleWorkflow: (workflow?: Workflow) => {
        if (!workflow) {
            return
        }
        const oldMap = get().workflowMap
        const newMap = new Map(oldMap)
        newMap.set(workflowKey(workflow), workflow)
        set({ workflowMap: newMap })
    },
}))