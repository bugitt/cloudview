import { Button, Modal } from "antd";
import { useState } from "react";
import { ExperimentWorkflowConfigurationResponse } from "../../cloudapi-client";
import { getWfConfigRespTag } from "../../models/workflow";
import { viewApiClient } from "../../utils/cloudapi";
import { notificationSuccess } from "../../utils/notification";
import { useExpWfConfRespListStore } from "../workflow/experimentWorkflowConfigurationStateManagement";

interface Props {
    wfConfigResp: ExperimentWorkflowConfigurationResponse
}

export function DeleteExperimentWorkflowConfigurationButton(props: Props) {
    const { wfConfigResp } = props

    const [open, setOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [modalContent, setModalContent] = useState(<></>);

    const deleteConf = useExpWfConfRespListStore().deleteById

    const showModal = () => {
        setModalContent(<p>{`确定要删除工作流配置 ${wfConfigResp.name} 吗？该配置下所有学生已经部署的工作流任务都将被删除。`}</p>)
        setOpen(true);
    };

    const handleOk = async () => {
        setConfirmLoading(true)
        await deleteWfConfig()
        setConfirmLoading(false)
        setOpen(false)
    };

    const handleCancel = () => {
        setOpen(false);
    };

    async function deleteWfConfig() {
        setModalContent(<p> 正在删除学生部署的所有工作流任务…… </p>)
        await viewApiClient.deleteWorkflowsByExperiment(wfConfigResp.expId, getWfConfigRespTag(wfConfigResp))
        setModalContent(<p> 正在删除当前工作流配置…… </p>)
        await deleteConf(wfConfigResp.id, wfConfigResp.expId)
        notificationSuccess('删除工作流配置成功！')
    }

    return (
        <>
            <Button type='primary' danger onClick={showModal}>删除当前工作流配置</Button>
            <Modal
                title="删除工作流配置"
                open={open}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                {modalContent}
            </Modal>
        </>
    )
}