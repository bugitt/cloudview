import { ModalForm, ProColumns, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import { Button, Tag } from 'antd'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import {
    ExperimentResponse,
    PostProjectsRequest,
    Project
} from '../../cloudapi-client'
import { cloudapiClient } from '../../utils/cloudapi'
import { randomColor } from '../../utils/color'
import { formatTimeStamp } from '../../utils/date'
import { messageError, messageInfo, notificationError } from '../../utils/notification'
import { GetColumnSearchProps } from '../../utils/table'
import { getUserId } from '../../utils/token'

interface ProjectTableProps {
    projectList: Project[]
}

interface ProjectTableType extends Project {
    key: React.Key
    courseName: string | undefined
    expName: string | undefined
    termName: string | undefined
    createdAt: string
    type: string
}

const CreateProjectForm = () => {
    const { data } = useRequest(() => cloudapiClient.getExperiments())
    const projectsReq = useRequest(cloudapiClient.getProjects)
    const experiments: ExperimentResponse[] = data?.data || []

    const onCreateProjectFormFinish = async (values: any) => {
        const req: PostProjectsRequest = { displayName: values.name as string }
        req.expId = values.expId || undefined
        req.description = values.description || undefined
        req.isPersonal = !values.expId
        try {
            await cloudapiClient.postProjects(req)
            messageInfo(`项目 ${values.name} 创建成功`)
            return true
        } catch (_) {
            messageError(`项目创建失败`)
            return false
        }
    }

    const expSelectOptions: Map<string, ReactNode> = new Map()
    experiments
        .filter(
            exp =>
                !projectsReq.data?.data.find(
                    project => project.expId === exp.id
                )
        )
        .forEach(e => {
            expSelectOptions.set(String(e.id), `${e.name} - (${e.course.name})`)
        })

    return (
        <ModalForm
            name="create_project"
            onFinish={onCreateProjectFormFinish}
            autoComplete="off"
            trigger={<Button type="primary">创建项目</Button>}
        >
            <ProFormText
                name="name"
                label="项目名称"
                rules={[
                    { required: true },
                ]}
            />
            <ProFormSelect
                name="expId"
                label="所属实验"
                valueEnum={expSelectOptions}
                placeholder="请选择"
                showSearch={true}
                extra="一个项目可以附属于一个实验，也可以无实验归属（个人项目）；但每个实验只能有一个项目"
            />
            <ProFormText name="description" label="描述信息" />
        </ModalForm>
    )
}

export const ProjectTable = (props: ProjectTableProps) => {
    const experimentsReq = useRequest(() => cloudapiClient.getExperiments())
    notificationError(experimentsReq.error)

    const [projectList, setProjectList] = useState<Project[]>(props.projectList)
    const projectListReq = useRequest(cloudapiClient.getProjects, {
        manual: true,
        onSuccess: (data) => {
            setProjectList(data?.data ?? props.projectList)
        },
        onError: (error) => {
            notificationError(error)
        }
    })

    const experiments: ExperimentResponse[] = (
        experimentsReq.data?.data || ([] as ExperimentResponse[])
    ).sort((a, b) => b.id - a.id)
    const experimentsMap = new Map<number, ExperimentResponse>()
    experiments.forEach(e => experimentsMap.set(e.id, e))
    const projects: ProjectTableType[] = projectList.map(
        (project, i) => {
            return {
                key: i,
                ...project,
                courseName: project.expId
                    ? experimentsMap.get(project.expId)?.course.name
                    : '',
                expName: project.expId
                    ? experimentsMap.get(project.expId)?.name
                    : '',
                termName: project.expId
                    ? experimentsMap.get(project.expId)?.course.term.name
                    : '',
                createdAt: formatTimeStamp(project.createdTime),
                type: project.expId ? 'exp' : 'personal'
            }
        }
    )
    const columns: ProColumns<ProjectTableType>[] = [
        {
            title: '项目名称',
            dataIndex: 'displayName',
            key: 'displayName',
            // @ts-ignore
            ...GetColumnSearchProps('displayName', undefined, (_, record) => {
                return (
                    <Link href={`/projects/${record.id}`}>
                        {record.displayName}
                    </Link>
                )
            })
        },
        { title: '所有者', dataIndex: 'owner', key: 'owner' },
        { title: '描述', dataIndex: 'description', key: 'description' },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            filters: true,
            onFilter: true,
            ellipsis: true,
            valueType: 'select',
            valueEnum: {
                exp: {
                    text: '实验项目'
                },
                personal: {
                    text: '个人项目'
                }
            },
            render: (_, record) => {
                const text = record.expId ? '实验项目' : '个人项目'
                return <Tag color={randomColor(text)}>{text}</Tag>
            }
        },
        { title: '实验名称', dataIndex: 'expName', key: 'expName' },
        { title: '课程名称', dataIndex: 'courseName', key: 'courseName' },
        { title: '学期', dataIndex: 'termName', key: 'termName' },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' }
    ]

    const useId = getUserId()

    return (
        <>
            <ProTable<ProjectTableType>
                options={{
                    reload: () => projectListReq.run(),
                }}
                loading={projectListReq.loading}
                dataSource={projects}
                columns={columns}
                search={false}
                headerTitle="项目列表"
                toolBarRender={() => [CreateProjectForm()]}
            />
        </>
    )
}