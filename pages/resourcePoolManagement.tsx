import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { ssrUserInfo } from "../lib/utils/token";
import { BaseSSRType } from "../lib/utils/type";
import { Space } from "antd";
import { ResourcePoolTable } from "../lib/components/projects/resource/ResourcePoolTable"
import { ResourcePool } from "../lib/models/resource";
import { viewApiClient } from "../lib/utils/cloudapi";
import { resourcePoolsClient } from "../lib/kube/cloudrun";

interface ResourcePoolManagementProps extends BaseSSRType {
    resourcePools: ResourcePool[]
}

export default function ResourcePools(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    if (typeof window === 'undefined') {
        return (<></>)
    }

    const { userInfo } = props

    if (userInfo.userId !== 'admin') {
        return (<><h1>Sorry, but you're not allowed here</h1></>)
    }

    return (
        <>
            <Space direction="vertical" style={{ width: '100% '}} size='large'>
                <ResourcePoolTable resourcePoolList={props.resourcePools}/>
            </Space>
        </>
    )
}


export const getServerSideProps: GetServerSideProps<ResourcePoolManagementProps> = async(ctx) => {
    const userInfo = ssrUserInfo(ctx)
    let resourcePools: ResourcePool[] = []
    
    if (userInfo.userId === 'admin') {
        const resourcePoolNames: string[] = await viewApiClient.getAllResourcePools()
        const promises = resourcePoolNames.map(name => 
            resourcePoolsClient.get(name)
        )

        resourcePools = await Promise.all(promises)
    }

    return {
        props: {
            userInfo: userInfo,
            resourcePools: resourcePools
        }
    }
}