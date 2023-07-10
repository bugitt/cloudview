import { NextApiRequest, NextApiResponse } from "next";
import { whoami } from "../../../../lib/utils/server";
import * as k8s from '@kubernetes/client-node';
import { k8sCoreV1Api } from "../../../../lib/kube/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse<k8s.V1PodList>) {
    const {
        query: { namespace },
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
            res.status(200).json(await getPodList(namespace as string))
    }
}

async function getPodList(ns: string, selector?: string) {
    const podList = (await k8sCoreV1Api.listNamespacedPod(ns, undefined, undefined, undefined, undefined, selector)).body
    podList.items = podList.items.map((it) => {
        it.apiVersion = "v1"
        it.kind = "Pod"
        return it
    })

    return podList
}
