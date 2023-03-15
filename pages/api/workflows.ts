import { NextApiRequest, NextApiResponse } from "next";
import { whoami } from "../../lib/utils/server";
import { crdApiVersion } from "../../lib/models/crd";
import { randomString } from "../../lib/utils/random";
import { imageBuilder } from "../../lib/config/env";
import { workflowClient } from "../../lib/kube/cloudrun";
import { crdWorkflowKind, CreateWorkflowRequest, ExperimentWorkflowConfiguration, UpdateWorkflowRequest, Workflow } from "../../lib/models/workflow";
import { CloudapiClientType, serverSideCloudapiClient } from "../../lib/utils/cloudapi";
import { LoginUserResponse } from "../../lib/cloudapi-client";
import { ensurePushSecret } from "../../lib/utils/secret";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Workflow[]>
) {
    const client = serverSideCloudapiClient(undefined, req)
    const user = await whoami(req, client)
    if (!user) {
        res.status(401).end('Unauthorized')
        return
    }

    const { method } = req;
    switch (method) {
        case 'GET':
            const projectName = req.query.projectName as string
            const project = (await client.getProjects(undefined, projectName)).data[0]
            const permissionOk = (await client.getCheckPermission('project', String(project.id), 'read')).data
            if (!permissionOk) {
                res.status(403).end('Forbidden')
                return
            }
            let selector: { [k: string]: string; } | undefined = undefined
            const tag = req.query.tag as string
            if (tag) {
                selector = {
                    'tag': tag,
                }
            }
            const workflows = await (workflowClient.list(projectName, selector))
            res.status(200).json(workflows)
            break

        case 'POST': {
            const body = req.body as CreateWorkflowRequest;
            const workflowList = await createOrUpdateWorkflow(body, client, user);
            res.status(200).json(workflowList)
            break
        }
        case 'PATCH': {
            const body = req.body as UpdateWorkflowRequest;
            const workflowList = await createOrUpdateWorkflow(body, client, user, body.workflowName);
            res.status(200).json(workflowList)
            break
        }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
            res.status(405).end(`Method ${method} Not Allowed`)
            break
    }
}

const createOrUpdateWorkflow = async (req: CreateWorkflowRequest, client: CloudapiClientType, user: LoginUserResponse, workflowName?: string) => {
    const experiment = req.expId ? (await client.getExperimentExperimentId(req.expId, true)).data : undefined
    const wfConfResp = req.confRespId ? (await client.getWorkflowConfigurationId(req.confRespId)).data : undefined
    const wfConf = wfConfResp ? JSON.parse(wfConfResp.configuration) as ExperimentWorkflowConfiguration : undefined

    async function createOrUpdate(ownerId: string) {
        const project = (await client.getProjects(req.expId, undefined, ownerId)).data[0]
        // make sure the push secret exist in the target namespace
        await ensurePushSecret(project.name)

        const finalWorkflowName = workflowName ?? `wf-${randomString(20)}`
        let workflow: Workflow = {
            apiVersion: crdApiVersion,
            kind: crdWorkflowKind,
            metadata: {
                name: finalWorkflowName,
                namespace: project.name,
                labels: {
                    creator: user.userId.toLowerCase(),
                    expId: experiment ? String(experiment.id) : '0',
                    tag: req.tag,
                    owner: ownerId.toLowerCase(),
                    templateKey: req.templateKey
                },
                annotations: req.annotation,
            },
            spec: {
                round: 1,
                build: req.context ? {
                    baseImage: wfConf?.baseImage ?? req.baseImage,
                    context: {
                        git: req.context.git ? {
                            urlWithAuth: req.context.git.urlWithAuth,
                            ref: req.context.git.ref,
                        } : undefined,
                        http: req.context.http ? {
                            url: req.context.http.url,
                        } : undefined,
                    },
                    command: wfConf?.buildSpec?.command ?? req.compileCommand,
                    registryLocation: imageBuilder.imageRegistry,
                    pushSecretName: imageBuilder.pushSecretName,
                } : undefined,
                deploy: {
                    changeEnv: req.context ? wfConf?.deploySpec.changeEnv ?? true : true,
                    baseImage: req.context ? undefined : wfConf?.baseImage ?? req.baseImage,
                    command: wfConf?.deploySpec.command ?? req.deployCommand,
                    ports: req.ports,
                    env: req.env,
                    resource: wfConf?.resource ?? req.resource!!,
                    resourcePool: wfConfResp?.resourcePool ?? req.resourcePool!!,
                    type: 'service',
                }
            }
        }

        if (wfConf?.customOptions.compileCommand && workflow.spec.build) {
            workflow.spec.build.command = req.compileCommand
        }
        if (wfConf?.customOptions.deployCommand && workflow.spec.deploy) {
            workflow.spec.deploy.command = req.deployCommand
        }
        if (wfConf?.customOptions.ports && workflow.spec.deploy) {
            workflow.spec.deploy.ports = req.ports
        }

        let oldWorkflow = (await workflowClient.list(project.name)).find(wf => wf.metadata?.name === finalWorkflowName)
        if (oldWorkflow) {
            oldWorkflow.metadata!!.labels = workflow.metadata?.labels
            oldWorkflow.metadata!!.annotations = workflow.metadata?.annotations
            oldWorkflow.spec = workflow.spec
            workflow = oldWorkflow
            workflow.spec.round = (oldWorkflow.status?.base?.currentRound ?? 0) + 1
        }

        return await workflowClient.createOrUpdate(workflow)
    }

    const delayIncrement = 500
    const createdWorkflowList = await Promise.all(req.ownerIdList.map(async (ownerId, index) => {
        await setTimeout(() => { }, delayIncrement * index)
        return await createOrUpdate(ownerId)
    }))

    return createdWorkflowList
}
