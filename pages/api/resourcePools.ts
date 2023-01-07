import { NextApiRequest, NextApiResponse } from "next"
import { resourcePoolsClient } from "../../lib/kube/cloudrun"
import { ResourcePool } from "../../lib/models/resource"
import { cloudapiClient } from "../../lib/utils/cloudapi"
import { whoami } from "../../lib/utils/server"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResourcePool[]>
) {
    const { query: { projectId } } = req

    const { method } = req;
    switch (method) {
        case 'GET':
            const resourceNames = (await cloudapiClient.getProjectProjectIdResourcePools(projectId as string)).data
            const resourcePoolList = [] as ResourcePool[]
            resourceNames.forEach(async (name) => {
                const resourcePool = await resourcePoolsClient.get(name)
                resourcePoolList.push(resourcePool)
            })
            res.status(200).json(resourcePoolList)
            break

        default:
            res.setHeader('Allow', ['GET'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}