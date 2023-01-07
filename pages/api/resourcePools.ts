import { NextApiRequest, NextApiResponse } from "next"
import { resourcePoolsClient } from "../../lib/kube/cloudrun"
import { ResourcePool } from "../../lib/models/resource"
import { serverSideCloudapiClient } from "../../lib/utils/cloudapi"
import { getTokenFromReq } from "../../lib/utils/token"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResourcePool[]>
) {
    const { query: { projectId } } = req

    const { method } = req;
    switch (method) {
        case 'GET':
            const resourceNames = (await serverSideCloudapiClient(getTokenFromReq(req)).getProjectProjectIdResourcePools(projectId as string)).data
            const resourcePoolList = await getResourcePools(resourceNames)
            res.status(200).json(resourcePoolList)
            break

        default:
            res.setHeader('Allow', ['GET'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}

async function getResourcePools(resourcePoolNameList: string[]) {
    return Promise.all(resourcePoolNameList.map(async (resourcePoolName) => {
        return await resourcePoolsClient.get(resourcePoolName)
    }))
}