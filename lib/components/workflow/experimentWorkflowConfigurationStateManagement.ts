import { SimpleEntity } from "../../cloudapi-client";
import { create } from "zustand";
import { cloudapiClient } from "../../utils/cloudapi";

export interface ExpWfConfRespListState {
    expWfConfRespList: SimpleEntity[]
    hasSubmitType: boolean
    deleteById: (id: number, expId: number) => Promise<void>
    refresh: (expId: number) => Promise<void>
}

export const useExpWfConfRespListStore = create<ExpWfConfRespListState>()((set, get) => ({
    expWfConfRespList: [],
    hasSubmitType: false,
    deleteById: async (id: number, expId: number) => {
        await cloudapiClient.deleteExperimentWorkflowConfigurationId(id)
        const resp = (await cloudapiClient.getExperimentExperimentIdSimpleWorkflowConfiguration(expId)).data
        set({ expWfConfRespList: resp.entityList, hasSubmitType: resp.hasSubmitType })
    },
    refresh: async (expId: number) => {
        const resp = (await cloudapiClient.getExperimentExperimentIdSimpleWorkflowConfiguration(expId)).data
        set({ expWfConfRespList: resp.entityList, hasSubmitType: resp.hasSubmitType })
    }
}))