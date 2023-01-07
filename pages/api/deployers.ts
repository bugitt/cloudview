import { NextApiRequest, NextApiResponse } from "next"
import { deployerClient } from "../../lib/kube/cloudrun"
import { crdApiVersion } from "../../lib/models/crd"
import { CreateDeployerRequest, Deployer } from "../../lib/models/deployer"
import { randomString } from "../../lib/utils/random"
import { whoami } from "../../lib/utils/server"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Deployer[]>
) {
    const user = await whoami(req)
    let projectName = ''
    if (req.method === 'POST') {
        projectName = req.body.projectName as string
    } else if (req.method === 'GET') {
        projectName = req.query.projectName as string
    }
    if (!user || !projectName) {
        res.status(401).end('Unauthorized')
        return
    }

    if (user.projects?.indexOf(projectName) === -1) {
        res.status(403).end('Forbidden')
        return
    }

    const { method } = req;
    switch (method) {
        case 'GET':
            const deployers = await (deployerClient.list(projectName))
            res.status(200).json(deployers)
            break

        case 'POST':
            const body = req.body as CreateDeployerRequest;
            const deployerList = await createDeployer(body);
            res.status(200).json(deployerList)
            break

        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}

const createDeployer = async (req: CreateDeployerRequest) => {
    const deployerName = `deployer-${randomString(15)}`

    const deployer: Deployer = {
        apiVersion: crdApiVersion,
        kind: 'Deployer',
        metadata: {
            name: deployerName,
            namespace: req.projectName,
            labels: {
                "displayName": req.name,
            }
        },
        spec: {
            containers: req.containers,
            round: -1,
            type: 'service',
            resourcePool: req.resourcePool,
        }
    }
    if (req.setup) {
        deployer.spec.round = 1
    }

    const createdDeployer = await deployerClient.createOrUpdate(deployer)
    return [createdDeployer]
}

