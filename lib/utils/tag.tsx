import { Tag } from "antd";
import { crdDisplayStatus } from "../models/crd";
import { crdStatusColor } from "./color";

export const crdStatusTag = (status: crdDisplayStatus) => {
    return (
        <Tag color={crdStatusColor(status)}>
            {status}
        </Tag>
    )
}