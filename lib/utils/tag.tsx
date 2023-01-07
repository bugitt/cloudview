import { Tag } from "antd";
import { crdDisplayStatus } from "../models/crd";
import { crdStatusColor } from "./color";

export const crdStatusTag = (status: crdDisplayStatus, stopped?: boolean) => {
    return (
        <Tag color={crdStatusColor(status)}>
            {status}{stopped && status !== '成功完成' && status !== '任务失败' ? ' （已中止）' : ''}
        </Tag>
    )
}