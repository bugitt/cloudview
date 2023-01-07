import { Project, Repository } from "../../cloudapi-client";
import ReactFlow, { Background, Controls, Edge, Handle, Node, NodeProps, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Space } from "antd";
import { useState } from "react";
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
import { Deployer, getDeployerDisplayName } from "../../models/deployer";
import { ShowDeployerDrawer } from "./deployer/ShowDeployerDrawer";

interface ProjectFlowProps {
    project: Project,
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
                <ProCard
                    title={(
                        <>
                            <SiOpencontainersinitiative />
                            &nbsp;
                            {getDeployerDisplayName(deployer)}
                        </>
                    )}
                    style={{
                        width: 400,
                        height: 100,
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
                    }}
                    bordered
                    boxShadow
                >
                    <ShowBuilderDrawer builder={builder} />
                </ProCard>
            </div>
        </>
    )
}

const GitRepoNode: React.FC<NodeProps<GitRepoNodeProps>> = (props) => {
    const { repo } = props.data
    return (
        <>
            <div>
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
            <Handle type="source" position={Position.Right} />
        </>
    )
}

export function ProjectFlow(props: ProjectFlowProps) {
    const { project } = props

    const [gitRepos, setGitRepos] = useState<Repository[]>([])
    const gitRepoReq = useRequest(() => cloudapiClient.getProjectProjectIdRepos(String(project.id)), {
        onSuccess: (data) => {
            setGitRepos(data.data)
        },
        onError: (err) => {
            notificationError('获取代码仓库列表失败')
        },
    })

    const [builders, setBuilders] = useState<Builder[]>([])
    const buildersReq = useRequest(() => viewApiClient.listImageBuilders(project.name), {
        onSuccess: (data) => {
            setBuilders(data)
        },
        onError: (_) => {
            notificationError('获取镜像构建任务列表失败')
        },
    })

    const [deployers, setDeployers] = useState<Deployer[]>([])
    const deployerReq = useRequest(() => viewApiClient.listDeployers(project.name), {
        onSuccess: (data) => {
            setDeployers(data)
        },
        onError: (_) => {
            notificationError('获取容器部署任务列表失败')
        },
    })

    const nodes: Node<any>[] = []
    const gitNodes: Node<GitRepoNodeProps>[] = gitRepos.map((repo, i) => {
        return {
            id: `gitRepo-${i}`,
            type: 'gitRepoNode',
            position: { x: 0, y: i * (100 + 25) + 25 },
            data: { repo: repo },
        }
    })
    nodes.push(...gitNodes)

    const builderNodes: Node<BuilderNodeProps>[] = builders.map((builder, i) => {
        return {
            id: `builder-${i}`,
            type: 'builderNode',
            position: { x: 500, y: i * (100 + 25) + 25 },
            data: { builder: builder },
        }
    })
    nodes.push(...builderNodes)

    const deployerNodes: Node<DeployerNodeProps>[] = deployers.map((deployer, i) => {
        return {
            id: `deployer-${i}`,
            type: 'deployerNode',
            position: { x: 1000, y: i * (100 + 25) + 25 },
            data: { deployer: deployer, project: project },
        }
    })
    nodes.push(...deployerNodes)

    const addGitRepoClick = () => {
        gitRepoReq.run()
    }
    const edges: Edge<any>[] = [
        {
            id: 'e1-2',
            source: '1',
            target: '2',
            label: 'This is an edge label',
        },
    ]
    return (
        <>
            <div style={{ height: 3000 }}>
                <ButtonGroup>
                    <AddGitRepoForm project={project} hook={() => { gitRepoReq.run() }} />
                    <AddImageBuilderForm project={project} hook={() => { buildersReq.run() }} />
                    <AddDeployerForm project={project} hook={() => { }} />
                </ButtonGroup>
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={{
                    gitRepoNode: GitRepoNode,
                    builderNode: BuilderNode,
                    deployerNode: DeployerNode,
                }}>
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </>
    )
}