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
            const permissionOk = (await client.getCheckPermission('project', project.id, 'read')).data
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
    const project = (await client.getProjects(req.expId)).data[0]
    const experiment = (await client.getExperimentExperimentId(req.expId, true)).data
    const wfConfResp = experiment.workflowExperimentConfiguration!!
    const wfConf = JSON.parse(wfConfResp.configuration) as ExperimentWorkflowConfiguration
    const finalWorkflowName = workflowName ?? `wf-${randomString(20)}`

    // make sure the push secret exist in the target namespace
    await ensurePushSecret(project.name)

    let workflow: Workflow = {
        apiVersion: crdApiVersion,
        kind: crdWorkflowKind,
        metadata: {
            name: finalWorkflowName,
            namespace: project.name,
            labels: {
                creator: user.userId,
                expId: String(experiment.id),
                tag: req.tag,
                owner: project.owner,
            }
        },
        spec: {
            round: 1,
            build: {
                baseImage: wfConf.baseImage,
                context: {
                    git: req.context.git ? {
                        urlWithAuth: req.context.git.urlWithAuth,
                        ref: req.context.git.ref,
                    } : undefined,
                    http: req.context.http ? {
                        url: req.context.http.url,
                    } : undefined,
                },
                command: wfConf.buildSpec?.command,
                registryLocation: imageBuilder.imageRegistry,
                pushSecretName: imageBuilder.pushSecretName,
            },
            deploy: {
                changeEnv: wfConf.deploySpec.changeEnv,
                command: wfConf.deploySpec.command,
                ports: req.ports,
                resource: wfConf.resource,
                resourcePool: wfConfResp.resourcePool,
                type: 'service',
            }
        }
    }

    if (wfConf.customOptions.compileCommand && workflow.spec.build) {
        workflow.spec.build.command = req.compileCommand
    }
    if (wfConf.customOptions.deployCommand && workflow.spec.deploy) {
        workflow.spec.deploy.command = req.deployCommand
    }
    if (wfConf.customOptions.ports && workflow.spec.deploy) {
        workflow.spec.deploy.ports = req.ports
    }

    let oldWorkflow = (await workflowClient.list(project.name)).find(wf => wf.metadata?.name === finalWorkflowName)
    if (oldWorkflow) {
        oldWorkflow.spec = workflow.spec
        workflow = oldWorkflow
        workflow.spec.round = (oldWorkflow.status?.base?.currentRound ?? 0) + 1
    }

    const createdWorkflow = await workflowClient.createOrUpdate(workflow)

    return [createdWorkflow]
}
