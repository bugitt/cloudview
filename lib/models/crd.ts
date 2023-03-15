import * as k8s from '@kubernetes/client-node';

export const crdApiVersion = "cloudapi.scs.buaa.edu.cn/v1alpha1";

export interface NamespacedName {
  name: string
  namespace: string
}

export interface BaseCRDStatus {
  base?: {
    currentRound: number;
    /**
     * HistoryList is used to store the history of the CRD.
     */
    historyList?: string[];
    /**
     * Message is mainly used to store the error message when the CRD is failed.
     */
    message?: string;
    status: 'UNDO' | 'Pending' | 'Doing' | 'Done' | 'Failed' | 'Unknown';
    startTime?: number
    endTime?: number
    podWorker?: PodWorker
  };
}

export interface BaseCRDHistory<T> {
  round: number
  status: crdDisplayStatus
  spec: T
  startTime?: number
  endTime?: number
}

export type crdDisplayStatus = '未调度' | '排队中' | '进行中' | '成功完成' | '任务失败' | '运行中' | '未知状态';

export interface PodWorker {
  name: string
  containerList: string[]
  initContainerList: string[]
}

export function getCrdDisplayName(obj: k8s.KubernetesObject): string {
  return obj.metadata?.annotations?.['displayName'] ?? obj.metadata?.labels?.displayName ?? obj.metadata?.name!!
}

export function isBindToWorkflow(obj: k8s.KubernetesObject, workflowName?: string): boolean {
  const wfLabel = obj.metadata?.labels?.['workflow']
  if (!wfLabel) {
    return false
  }
  if (workflowName) {
    return wfLabel === workflowName
  }
  return true
}
