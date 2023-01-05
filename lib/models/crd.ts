import * as k8s from '@kubernetes/client-node';

export const crdApiVersion = "cloudapi.scs.buaa.edu.cn/v1alpha1";

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
      status: string;
    };
}