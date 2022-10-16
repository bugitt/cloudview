import { CopyOutlined } from '@ant-design/icons'
import ProTable, { ProColumns } from '@ant-design/pro-table'
import { useRequest } from 'ahooks'
import { Button } from 'antd'
import React from 'react'
import { ProjectIdProps } from '../../assets/types'
import { Repository } from '../../cloudapi-client'
import { cloudapiClient, copyToClipboard } from '../../utils'

interface RepositoryTableType extends Repository {
    key: React.Key
}

export const RepositoryListTable: React.FC<ProjectIdProps> = ({
    projectId
}) => {
    const projectRequest = useRequest(() =>
        cloudapiClient.getProjectProjectId(Number(projectId))
    )
    const project = projectRequest.data?.data
    const { data, loading } = useRequest(
        () => cloudapiClient.getProjectProjectIdRepos(projectId),
        { pollingInterval: 1000 }
    )
    const repoList: RepositoryTableType[] =
        data?.data?.map((repo, i) => {
            return {
                key: i,
                ...repo
            }
        }) || []
    const columns: ProColumns<RepositoryTableType>[] = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => {
                return (
                    <a href={record.url} target="_blank">
                        {record.name}
                    </a>
                )
            }
        },
        {
            title: '克隆仓库',
            key: 'cloneRepo',
            render: (_, record) => {
                return (
                    <a
                        onClick={() =>
                            copyToClipboard(
                                `git clone https://${record.username}:${record.token}@scs.buaa.edu.cn/git/${record.name}.git`,
                                '克隆仓库命令'
                            )
                        }
                    >
                        <CopyOutlined />
                    </a>
                )
            }
        }
    ]
    return (
        <ProTable
            columns={columns}
            dataSource={repoList}
            loading={!data && loading}
            headerTitle="代码仓库列表"
            search={false}
            toolBarRender={() => [
                <Button
                    type="primary"
                    onClick={() => {
                        window
                            .open(
                                `https://scs.buaa.edu.cn/git/repo/create?${
                                    project ? `owner=${project.name}` : ''
                                }`,
                                '_blank'
                            )
                            ?.focus()
                    }}
                >
                    创建代码仓库
                </Button>
            ]}
        />
    )
}
