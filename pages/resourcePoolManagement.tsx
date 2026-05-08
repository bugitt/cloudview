import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { ssrUserInfo, setUserInfo } from "../lib/utils/token";
import { BaseSSRType } from "../lib/utils/type";
import { Space } from "antd";
import { ResourcePoolTable } from "../lib/components/projects/resource/ResourcePoolTable"
import { ResourcePool } from "../lib/models/resource";
import { viewApiClient } from "../lib/utils/cloudapi";
import { resourcePoolsClient } from "../lib/kube/cloudrun";
import { useRequest } from "ahooks";
import { useState } from "react";

interface ResourcePoolManagementProps extends BaseSSRType {
    resourcePools: ResourcePool[]
}

export default function ResourcePools(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    if (typeof window === 'undefined') {
        return (<></>)
    }

    const { userInfo } = props
    setUserInfo(userInfo)

    if (userInfo.userId !== 'admin') {
        return (<><h1>Sorry, but you're not allowed here</h1></>)
    }

    const [resourcePools, setResourcePools] = useState<ResourcePool[]>(props.resourcePools)

    const listReq = useRequest(viewApiClient.getAllResourcePools, {
        manual: true,
        onSuccess: (data) => setResourcePools(data),
    })

    const handleRefresh = () => listReq.run()

    const ensurePersonalProjectsReq = useRequest(viewApiClient.ensurePersonalProjects, {
        manual: true,
        onSuccess: () => handleRefresh()
    })

    const handleEnsurePersonalProjects = () => ensurePersonalProjectsReq.run()

    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size='large'>
                <ResourcePoolTable
                    resourcePoolList={resourcePools}
                    onRefresh={handleRefresh}
                    onEnsurePersonalProjects={handleEnsurePersonalProjects}
                    loading={listReq.loading}
                />
            </Space>
        </>
    )
}


export const getServerSideProps: GetServerSideProps<ResourcePoolManagementProps> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    let resourcePools: ResourcePool[] = []

    if (userInfo.userId === 'admin') {
        resourcePools = await resourcePoolsClient.list()
    }

    return {
        props: {
            userInfo: userInfo,
            resourcePools: resourcePools
        }
    }
}
