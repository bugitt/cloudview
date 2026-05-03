import { ProColumns } from "@ant-design/pro-components"
import { resourcePoolsClient } from "../../../kube/cloudrun"
import { ResourcePool } from "../../../models/resource"
import { cloudapiClient, viewApiClient } from "../../../utils/cloudapi"
import React from "react"

interface ResourcePoolTableProps {
    resourcePoolList: ResourcePool[]
}

interface ResourcePoolTableType extends ResourcePool {
    key: React.Key
}

export const ResourcePoolTable: (prop: ResourcePoolTableProps) => JSX.Element = () => {
}