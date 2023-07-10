import { Modal, Typography } from "antd";
import * as k8s from '@kubernetes/client-node';
import { useState } from "react";
import dynamic from "next/dynamic";
import YAML from 'yaml'
import { viewApiClient } from "../utils/cloudapi";
import { messageSuccess, notificationError } from "../utils/notification";
export interface KubeObjectModalProps {
    obj: k8s.KubernetesObject
    title?: string
    hook?: () => void
}

const CodeEditor = dynamic(import('../utils/code-editor'), {
    ssr: false,
})

export function KubeObjectModal(props: KubeObjectModalProps) {
    const [objYamlStr, setObjYamlStr] = useState<string>(YAML.stringify(props.obj))

    const [open, setOpen] = useState(false);

    const showModal = () => {
        setOpen(true);
        setObjYamlStr(YAML.stringify(props.obj))
    };

    const hideModal = () => {
        setOpen(false);
    };

    const updateObj = async () => {
        try {
            const obj = YAML.parse(objYamlStr) as k8s.KubernetesObject
            await viewApiClient.updateKubeObject(obj)
            messageSuccess('更新成功')
            hideModal()
            if (props.hook) {
                props.hook()
            }
        } catch (e) {
            notificationError('更新失败')
        }
    };

    return (
        <>
            <Typography.Link
                onClick={showModal}
            >查看/编辑</Typography.Link>
            <Modal
                title={`${props.title || props.obj.kind}: ${props.obj.metadata?.name}`}
                width='60%'
                open={open}
                onOk={updateObj}
                onCancel={hideModal}
                okText="更新"
                cancelText="取消"
            >
                <CodeEditor
                    language="yaml"
                    height="500px"
                    value={objYamlStr}
                    onChange={(value: string, _: any) => {
                        setObjYamlStr(value)
                    }}
                />
            </Modal>
        </>
    )
}