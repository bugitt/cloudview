import { NextApiRequest, NextApiResponse } from "next";
import { whoami } from "../../../lib/utils/server";
import * as k8s from '@kubernetes/client-node';
import { k8sCoreV1Api } from "../../../lib/kube/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse<k8s.V1NodeList>) {
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
        case 'GET':
            res.status(200).json((await k8sCoreV1Api.listNode()).body)
            return

    }
}