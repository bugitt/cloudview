import { NextApiRequest, NextApiResponse } from "next";
import { deployerClient } from "../../../lib/kube/cloudrun";
import { Deployer } from "../../../lib/models/deployer";
import { whoami } from "../../../lib/utils/server";


export default async function handler(req: NextApiRequest, res: NextApiResponse<Deployer>) {
    const {
        query: { name },
        method,
    } = req;

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

    switch (method) {
        case 'GET':
            const deployer = await deployerClient.get(name as string, projectName)
            deployer ? res.status(200).json(deployer) : res.status(404).end('Not Found')
            break
        default:
            res.setHeader('Allow', ['GET'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}
