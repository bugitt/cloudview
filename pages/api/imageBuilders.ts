import { NextApiRequest, NextApiResponse } from "next";
import { Builder, crdBuilderKind } from "../../lib/models/builder";
import { CreateImageBuilderRequest } from "../../lib/models/createImageBuilderRequest";
import { whoami } from "../../lib/utils/server";
import * as k8s from '@kubernetes/client-node';
import { crdApiVersion } from "../../lib/models/crd";
import { randomString } from "../../lib/utils/random";
import { imageBuilder } from "../../lib/config/env";
import { imageBuilderClient } from "../../lib/kube/cloudrun";
import { createOrUpdate } from "../../lib/kube/objects";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Builder[]>
) {
    const user = await whoami(req)
    const projectName = req.body.projectName ? req.body.projectName as string : null
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
            res.status(200).json([])
            break

        case 'POST':
            const body = req.body as CreateImageBuilderRequest;
            const builderList = await createImageBuilder(body);
            res.status(200).json(builderList)
            break
            
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}

const createImageBuilder = async(req: CreateImageBuilderRequest) => {
    const builderName = `builder-${randomString(15)}`
    const destination = `${imageBuilder.imageRegistry}/${req.projectName}/${req.imageMeta.name}:${req.imageMeta.tag}`
    
    // make sure the push secret exist in the target namespace
    const secret: k8s.V1Secret = {
        metadata: {
            name: imageBuilder.pushSecretName,
            namespace: req.projectName,
        },
        type: "kubernetes.io/dockerconfigjson",
        data: {
            ".dockerconfigjson": imageBuilder.dockerconfigjson
        },
    }
    await createOrUpdate(secret, "v1", "Secret")

    const builder: Builder = {
        apiVersion: crdApiVersion,
        kind: crdBuilderKind,
        metadata: {
            name: builderName,
            namespace: req.projectName,
            labels: {
                "image.owner": req.projectName,
                "image.name": req.imageMeta.name,
                "image.tag": req.imageMeta.tag,
            }
        },
        spec: {
            context: {
                git: req.context.git ? {
                    urlWithAuth: req.context.git.urlWithAuth,
                    ref: req.context.git.ref,
                } : undefined,
                raw: req.context.raw,
                s3: req.context.s3 ? {
                    accessKeyID: imageBuilder.s3.accessKeyID!!,
                    accessSecretKey: imageBuilder.s3.accessSecretKey!!,
                    bucket: imageBuilder.s3.bucket!!,
                    endpoint: imageBuilder.s3.endpoint,
                    region: imageBuilder.s3.region!!,
                    objectKey: req.context.s3.objectKey,
                } : undefined,
            },
            destination: destination,
            dockerfilePath: req.dockerfilePath ?? "./Dockerfile",
            pushSecretName: imageBuilder.pushSecretName,
            workspacePath: req.workspacePath ?? "./",
            round: -1,
        }
    }

    const createdBuilder = await imageBuilderClient.createOrUpdate(builder)

    return [createdBuilder]
}

