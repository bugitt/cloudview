import { NextApiRequest, NextApiResponse } from "next";
import { whoami } from "../../../lib/utils/server";
import * as k8s from '@kubernetes/client-node';
import { updateK8sObj } from "../../../lib/kube/objects";

export default async function handler(req: NextApiRequest, res: NextApiResponse<k8s.KubernetesObject>) {
    const {
        method,
    } = req;

    const user = await whoami(req)

    // TODO 更细粒度的权限控制
    if (user.role !== 'superAdmin') {
        res.status(403).end('Forbidden')
        return
    }

    switch (method) {
        case 'PUT':
            try {
                const obj = req.body as k8s.KubernetesObject
                res.status(200).json(await updateK8sObj(obj))
                return
            } catch (e) {
                res.status(500).end(e)
                return
            }

    }
}
