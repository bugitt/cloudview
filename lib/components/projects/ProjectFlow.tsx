import { Project, Repository } from "../../cloudapi-client";
import { NetworkComponentPropsType } from "../../utils/type";
import ReactFlow, { Background, Controls, Edge, Handle, Node, NodeProps, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Space } from "antd";
import { useState } from "react";
import { RiGitRepositoryLine } from "react-icons/ri";
import { useRequest } from "ahooks";
import { notificationError } from "../../utils/notification";
import ButtonGroup from "antd/es/button/button-group";
import { AddGitRepoForm } from "./git/AddGitRepoForm";
import { ProCard } from "@ant-design/pro-components";
import { ShowGitRepoDrawer } from "./git/ShowGitRepoDrawer";
import { CopyGitCloneCommandButton } from "./git/CopyGitCloneCommandButton";

interface ProjectFlowProps extends NetworkComponentPropsType {
    project: Project,
}

interface GitRepoNodeProps {
    repo: Repository,
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
                        <CopyGitCloneCommandButton repo={repo} />
                    </Space>
                </ProCard>
            </div>
            <Handle type="source" position={Position.Right} />
        </>
    )
}

export function ProjectFlow(props: ProjectFlowProps) {
    const { project, client } = props
    const [gitRepos, setGitRepos] = useState<Repository[]>([])
    const gitRepoReq = useRequest(() => client.getProjectProjectIdRepos(String(project.id)), {
        onSuccess: (data) => {
            setGitRepos(data.data)
        },
        onError: (err) => {
            notificationError('获取代码仓库列表失败')
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
    gitNodes.forEach(it => nodes.push(it))
    nodes.concat(gitNodes)
    const addGitRepoClick = () => {
        console.log('addGitRepoClick')
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
                    <AddGitRepoForm client={client} project={project} hook={() => { gitRepoReq.run() }} />
                    <Button onClick={addGitRepoClick} type='primary'>添加 镜像构建任务</Button>
                    <Button onClick={addGitRepoClick} type='primary'>添加 容器部署任务</Button>
                </ButtonGroup>
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={{
                    gitRepoNode: GitRepoNode
                }}>
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </>
    )
}