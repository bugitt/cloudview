import { Project, Repository } from "../../cloudapi-client";
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, Background, Connection, Controls, Edge, EdgeChange, Handle, Node, NodeChange, NodeProps, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Descriptions, Drawer, Space, Spin } from "antd";
import { useCallback, useState } from "react";
import { RiGitRepositoryLine } from "react-icons/ri";
import { FaDocker } from "react-icons/fa";
import { SiOpencontainersinitiative } from "react-icons/si";
import { useRequest } from "ahooks";
import { notificationError } from "../../utils/notification";
import ButtonGroup from "antd/es/button/button-group";
import { AddGitRepoForm } from "./git/AddGitRepoForm";
import { ProCard } from "@ant-design/pro-components";
import { ShowGitRepoDrawer } from "./git/ShowGitRepoDrawer";
import { CopyGitRepoUrlButton } from "./git/CopyButton";
import { cloudapiClient, viewApiClient } from "../../utils/cloudapi";
import { AddImageBuilderForm } from "./image/AddImageBuilderForm";
import { Builder, builderDisplayName, getImageMeta } from "../../models/builder";
import { ShowBuilderDrawer } from "./image/ShowBuilderDrawer";
import { AddDeployerForm } from "./deployer/AddDeployerForm";
import { Deployer } from "../../models/deployer";
import { ShowDeployerDrawer } from "./deployer/ShowDeployerDrawer";
import { AddDeployerTriggerForm } from "./image/AddDeployerTriggerForm";
import { ReloadOutlined } from "@ant-design/icons";
import { ResourceStatCardInProject } from "./resource/stat/ResourceStatCard";
import { ResourcePool } from "../../models/resource";
import { ImageListTable } from "./image/ImageListTable";
import { getCrdDisplayName } from "../../models/crd";

interface ProjectFlowProps {
    project: Project,
    title: string,
}

interface GitRepoNodeProps {
    repo: Repository,
}

interface BuilderNodeProps {
    builder: Builder
}

interface DeployerNodeProps {
    deployer: Deployer
    project: Project
}

const DeployerNode: React.FC<NodeProps<DeployerNodeProps>> = (props) => {
    const { deployer, project } = props.data
    return (
        <>
            <div>
                <Handle type="target" position={Position.Left} />
                <ProCard
                    title={(
                        <>
                            <SiOpencontainersinitiative />
                            &nbsp;
                            {getCrdDisplayName(deployer)}
                        </>
                    )}
                    style={{
                        width: 400,
                        height: 100,
                        marginLeft: 3,
                        marginRight: 3,
                    }}
                    bordered
                    boxShadow
                >
                    <ShowDeployerDrawer deployer={deployer} project={project} />
                </ProCard>
            </div>
        </>
    )
}

const BuilderNode: React.FC<NodeProps<BuilderNodeProps>> = (props) => {
    const { builder } = props.data
    const imageMeta = getImageMeta(builder)
    return (
        <>

            <div>
                <Handle type="target" position={Position.Left} />
                <ProCard
                    title={(
                        <>
                            <FaDocker />
                            &nbsp;
                            {builderDisplayName(builder)}
                        </>
                    )}
                    style={{
                        width: 400,
                        height: 100,
                        marginLeft: 3,
                        marginRight: 3,
                    }}
                    bordered
                    boxShadow
                >
                    <ShowBuilderDrawer builder={builder} />
                </ProCard>
                <Handle type="source" position={Position.Right} />
            </div>
        </>
    )
}

const GitRepoNode: React.FC<NodeProps<GitRepoNodeProps>> = (props) => {
    const { repo } = props.data
    return (
        <>
            <div>
                <Handle type="source" position={Position.Right} />
                <ProCard
                    title={(
                        <>
                            <RiGitRepositoryLine />
                            &nbsp;
                            {repo.name}
                        </>
                    )}
                    style={{
                        width: 400,
                        height: 100,
                        marginLeft: 3,
                        marginRight: 3,
                    }}
                    bordered
                    boxShadow
                >
                    <Space>
                        <ShowGitRepoDrawer repo={repo} />
                        <CopyGitRepoUrlButton repo={repo} />
                    </Space>
                </ProCard>
            </div>
        </>
    )
}

interface ManageDeployerHook {
    deployer?: Deployer
    builder?: Builder
    open: boolean,
}

interface NodeMapType<T> {
    [k: string]: T
}

export function ProjectFlow(props: ProjectFlowProps) {
    const { project, title } = props

    const [manageDeployerHook, setManageDeployerHook] = useState<ManageDeployerHook>({ open: false })

    const [gitRepoNodeMap, setGitRepoNodeMap] = useState<NodeMapType<Repository>>({})
    const [builderNodeMap, setBuilderNodeMap] = useState<NodeMapType<Builder>>({})
    const [deployerNodeMap, setDeployerNodeMap] = useState<NodeMapType<Deployer>>({})

    const [gitRepoNodes, setGitRepoNodes] = useState<Node<GitRepoNodeProps>[]>([]);
    const [builderNodes, setBuilderNodes] = useState<Node<BuilderNodeProps>[]>([]);
    const [deployerNodes, setDeployerNodes] = useState<Node<DeployerNodeProps>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );
    const onConnect = useCallback(
        (connection: Connection) => {
            if (connection.source?.startsWith('builder-') && connection.target?.startsWith('deployer-')) {
                const builder = builderNodeMap[connection.source]
                const deployer = deployerNodeMap[connection.target]
                setManageDeployerHook({ open: true, builder, deployer })
            }
        },
        [builderNodeMap, deployerNodeMap]
    );

    const gitRepoReq = useRequest(() => cloudapiClient.getProjectProjectIdRepos(String(project.id)), {
        onSuccess: (data) => {
            const nodeMap: NodeMapType<Repository> = {}
            const gitNodes: Node<GitRepoNodeProps>[] = data.data.map((repo, i) => {
                const id = repo.repoName
                nodeMap[id] = repo
                return {
                    id: id,
                    type: 'gitRepoNode',
                    position: { x: 0, y: i * (100 + 25) + 25 },
                    data: { repo: repo },
                }
            })
            setGitRepoNodeMap(nodeMap)
            setGitRepoNodes(gitNodes)
        },
        onError: (_) => {
            notificationError('获取代码仓库列表失败')
        },
    })

    const buildersReq = useRequest(() => viewApiClient.listImageBuilders(project.name), {
        onSuccess: (data) => {
            const nodeMap: NodeMapType<Builder> = {}
            const builderNodes: Node<BuilderNodeProps>[] = data.map((builder, i) => {
                const id = builder.metadata?.name!!
                nodeMap[id] = builder

                const hooks = builder.spec.deployerHooks
                if (hooks) {
                    hooks.forEach((hook) => {
                        addMyEdge(id, hook.deployerName)
                    })
                }

                return {
                    id: id,
                    type: 'builderNode',
                    position: { x: 500, y: i * (100 + 25) + 25 },
                    data: { builder: builder },
                }
            })
            console.log(builderNodes)
            setBuilderNodes(builderNodes)
            setBuilderNodeMap(nodeMap)
        },
        onError: (_) => {
            notificationError('获取镜像构建任务列表失败')
        },
    })

    const deployerReq = useRequest(() => viewApiClient.listDeployers(project.name), {
        onSuccess: (data) => {
            const nodeMap: NodeMapType<Deployer> = {}
            const deployerNodes: Node<DeployerNodeProps>[] = data.map((deployer, i) => {
                const id = deployer.metadata?.name!!
                nodeMap[id] = deployer
                return {
                    id: id,
                    type: 'deployerNode',
                    position: { x: 1000, y: i * (100 + 25) + 25 },
                    data: { deployer: deployer, project: project },
                }
            })
            setDeployerNodes(deployerNodes)
            setDeployerNodeMap(nodeMap)
        },
        onError: (_) => {
            notificationError('获取容器部署任务列表失败')
        },
    })

    const addMyEdge = (source: string, target: string) => {
        const connection: Connection = {
            source: source,
            target: target,
            sourceHandle: null,
            targetHandle: null,
        }
        setEdges((eds) => addEdge(connection, eds))
    }

    return (
        <>
            <Descriptions title={title} />
            <div style={{ height: 700 }}>
                <Space>
                    <ButtonGroup>
                        <AddGitRepoForm project={project} hook={() => { gitRepoReq.run() }} />
                        <AddImageBuilderForm project={project} hook={() => { buildersReq.run() }} />
                        <AddDeployerForm project={project} hook={() => { deployerReq.run() }} />
                    </ButtonGroup>

                    <Button style={{ background: "geekblue" }} onClick={() => {
                        gitRepoReq.run()
                        buildersReq.run()
                        deployerReq.run()
                    }}>
                        <ReloadOutlined />
                        刷新
                    </Button>
                    <Spin spinning={gitRepoReq.loading || buildersReq.loading || deployerReq.loading} />
                </Space>
                <ReactFlow
                    nodes={(gitRepoNodes as Node[]).concat(builderNodes).concat(deployerNodes)}
                    edges={edges}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={{
                        gitRepoNode: GitRepoNode,
                        builderNode: BuilderNode,
                        deployerNode: DeployerNode,
                    }}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
                <Drawer
                    title="添加镜像部署任务触发器"
                    placement="right"
                    onClose={() => {
                        setManageDeployerHook({ open: false })
                    }}
                    open={manageDeployerHook.open}
                >
                    <AddDeployerTriggerForm
                        builder={manageDeployerHook.builder}
                        deployer={manageDeployerHook.deployer}
                        project={project}
                        hook={() => {
                            setManageDeployerHook((m) => { m.open = false; return m })
                            addMyEdge(manageDeployerHook.builder?.metadata?.name!!, manageDeployerHook.deployer?.metadata?.name!!)
                        }}
                        open={manageDeployerHook.open}
                    />
                </Drawer>
            </div>
        </>
    )
}