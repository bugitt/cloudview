import { LoadingOutlined } from "@ant-design/icons";
import { ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, Modal, Popconfirm, Space, Typography } from "antd";
import { useState, ChangeEvent } from "react";
import { CreateVmApplyResponse, ExperimentResponse, VirtualMachine, VmNetInfo } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { messageInfo, notificationError } from "../../utils/notification";
import { AddVmIntoApplyForm } from "./AddVmIntoApplyForm";
import { VmApplyForm } from "./VmApplyForm";

interface Props {
    fetchVmList: (experimentId?: number) => Promise<VirtualMachine[]>
    studentId?: string
    teacherId?: string
    isAdmin: boolean
    experimentId?: number
}

interface DataType {
    key: React.Key
    name: string
    studentId: string
    state: string
    expName?: string
    diskSize: number
    memory: number
    cpu: number
    systemName?: string
    ip?: string
    vm: VirtualMachine
}

function findValidIp(netInfos: VmNetInfo[]) {
    let validIp = '-'
    netInfos.forEach(netInfo => {
        netInfo.ipList.forEach(ip => {
            if (ip.startsWith("10.")) {
                validIp = ip
                return
            }
        })
    })
    return validIp
}

export function VmListTable(props: Props) {
    const { fetchVmList } = props
    const [vmApply, setVmApply] = useState<CreateVmApplyResponse | undefined>(undefined)
    const [vmList, setVmList] = useState<DataType[]>([])
    const [vmShownList, setVmShownList] = useState<DataType[]>([])
    const [currentVm, setCurrentVm] = useState<DataType | undefined>(undefined)
    const [selectedVmList, setSelectedVmList] = useState<DataType[]>([])
    const [isVmDetailModalOpen, setIsVmDetailModalOpen] = useState(false);
    const [loading, setLoading] = useState(false)

    const vmListReq = useRequest(() => {
        setLoading(true)
        return fetchVmList(props.experimentId)
    }, {
        onSuccess: async (vmList) => {
            const expIdSet = new Set<number>()
            vmList.forEach(vm => {
                if (vm.experimentId != 0) {
                    expIdSet.add(vm.experimentId)
                }
            })
            const expIdMap = new Map<number, ExperimentResponse>()
            await Promise.all(Array.from(expIdSet.values()).map(async (expId) => {
                const experiment = await (await cloudapiClient.getExperimentExperimentId(expId)).data
                expIdMap.set(expId, experiment)
            }))
            const data: DataType[] = await Promise.all(vmList.filter(vm => !vm.isTemplate)
                .map((vm, index) => {
                    const item: DataType = {
                        key: index,
                        studentId: vm.studentId,
                        name: vm.name,
                        state: vm.state,
                        diskSize: vm.diskSize / 1024 / 1024 / 1024,
                        memory: vm.memory / 1024,
                        cpu: vm.cpu,
                        systemName: vm.osFullName,
                        ip: findValidIp(vm.netInfos),
                        vm: vm,
                    }
                    if (vm.experimentId != 0) {
                        const experiment = expIdMap.get(vm.experimentId)
                        item.expName = experiment?.name
                    }
                    return item
                }))
            setVmList(data)
            setVmShownList(data)
            setLoading(false)
        },
        onError: (_) => {
            notificationError("获取虚拟机列表失败")
            setLoading(false)
        }
    })

    useRequest(() => {
        if (props.experimentId) {
            return cloudapiClient.getVmsApply(props.experimentId).then(res => res.data.length > 0 ? res.data[0] : undefined)
        } else {
            return Promise.resolve(undefined)
        }
    }, {
        onSuccess: (data) => {
            setVmApply(data)
        }
    })

    const columns: ProColumns<DataType>[] = [
        {
            title: '序号',
            dataIndex: 'index',
            valueType: 'indexBorder',
            key: 'index',
            width: 48,
            search: false,
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            valueType: 'text'
        },
        {
            title: '学号',
            dataIndex: 'studentId',
            key: 'studentId',
            valueType: 'text'
        },
        {
            title: '状态',
            dataIndex: 'state',
            key: 'state',
            render: (_, record) => {
                switch (record.state.toLocaleLowerCase()) {
                    case "creating": return <> <LoadingOutlined /> 创建中 </>
                    case "booting": return <> <LoadingOutlined /> 开机中 </>;
                    case "running": return <> 运行中 </>;
                    case "shuttingdown": return <> <LoadingOutlined /> 关机中 </>;
                    case "stopped": return <> 已关机 </>;
                    case "deleting": return <> <LoadingOutlined /> 删除中 </>;
                }
            }
        },
        {
            title: '所属实验',
            key: 'expName',
            dataIndex: 'expName',
            valueType: 'text',
        },
        {
            title: '磁盘（GB）',
            key: 'diskSize',
            dataIndex: 'diskSize',
            valueType: 'text',
        },
        {
            title: '内存（GB）',
            key: 'memory',
            dataIndex: 'memory',
            valueType: 'text',
        },
        {
            title: 'CPU（核）',
            key: 'cpu',
            dataIndex: 'cpu',
            valueType: 'text',
        },
        {
            title: '系统',
            key: 'systemName',
            dataIndex: 'systemName',
            valueType: 'text',
        },
        {
            title: 'IP',
            key: 'ip',
            dataIndex: 'ip',
            valueType: 'text',
        },
        {
            title: '操作',
            key: 'option',
            valueType: 'option',
            render: (_, record) => {
                return <>
                    <Space>
                        <Typography.Link onClick={() => {
                            setCurrentVm(record)
                            setIsVmDetailModalOpen(true)
                        }}>详情</Typography.Link>
                        {
                            record.name.startsWith("docker") && record.state === 'running' &&
                            <Typography.Link
                                href={`http://${record.ip}:7681`}
                                target='_blank'
                            >访问虚拟机</Typography.Link>
                        }
                        <Typography.Link disabled={record.state !== 'stopped'}
                            onClick={() => {
                                cloudapiClient.patchVmVmIdPower(record.vm.id, "poweron")
                                messageInfo('成功提交开机任务')
                                vmListReq.run()
                            }}
                        >开机</Typography.Link>
                        <Typography.Link disabled={record.state !== 'running'}
                            onClick={() => {
                                cloudapiClient.patchVmVmIdPower(record.vm.id, "poweroff")
                                messageInfo('成功提交关机任务')
                                vmListReq.run()
                            }}>关机</Typography.Link>
                        <Popconfirm
                            title="删除虚拟机"
                            description={`确定要删除虚拟机 ${record.name} 吗？`}
                            onConfirm={async () => {
                                await cloudapiClient.deleteVmVmId(record.vm.id)
                            }}
                            okText="是"
                            cancelText="否"
                        ><Typography.Link >删除</Typography.Link>
                        </Popconfirm>
                    </Space>
                </>
            }
        }
    ]

    return (<>
        <ProTable<DataType>
            options={{
                reload: () => { vmListReq.run() }
            }}
            rowSelection={{
                onChange: (_, selectedRows) => {
                    setSelectedVmList(selectedRows)
                }
            }}
            tableAlertOptionRender={() => {
                return (
                    <Space>
                        <Popconfirm
                            title="删除虚拟机"
                            description={`确定要删除虚拟机所选中的这些虚拟机吗？`}
                            onConfirm={() => {
                                Promise.all(selectedVmList.map(async (vm) => {
                                    await cloudapiClient.deleteVmVmId(vm.vm.id)
                                })).then(() => {
                                    messageInfo('成功提交删除任务')
                                }).then(() => {
                                    vmListReq.run()
                                })
                            }}
                            okText="是"
                            cancelText="否"
                        >
                            <a>批量删除</a>
                        </Popconfirm>
                    </Space>
                );
            }}
            toolBarRender={() => [
                !props.isAdmin && !vmApply && <VmApplyForm key="apply" title="申请虚拟机" onOk={() => {
                    vmListReq.run()
                }}
                    studentId={props.studentId}
                    teacherId={props.teacherId}
                    experimentId={props.experimentId}
                />,

                !props.isAdmin && props.experimentId && vmApply && <AddVmIntoApplyForm
                    key="add"
                    experimentId={props.experimentId}
                    existingVmStudentIdList={vmList.map(vm => vm.vm.studentId)}
                    vmApply={vmApply}
                />,

                props.experimentId && vmApply && <Popconfirm
                    title="删除虚拟机"
                    description={`确定要删除全部虚拟机吗？`}
                    onConfirm={() => {
                        Promise.all(vmList.map(async (vm) => {
                            await cloudapiClient.deleteVmVmId(vm.vm.id)
                        })).then(() => {
                            messageInfo('成功提交删除任务')
                        }).then(() => {
                            vmListReq.run()
                        })
                    }}
                    okText="是"
                    cancelText="否"
                ><Button type="primary" danger={true}>删除全部虚拟机</Button>
                </Popconfirm>
            ]}
            toolbar={{
                search: {
                    onSearch: (search: string) => {
                        setVmShownList(vmList.filter(vm =>
                            vm.name.toLowerCase().includes(search.toLowerCase()) ||
                            vm.systemName?.toLowerCase().includes(search.toLowerCase()) ||
                            vm.ip?.toLowerCase().includes(search.toLowerCase())))
                    },
                    onChange: (event: ChangeEvent<HTMLInputElement>) => {
                        setVmShownList(vmList.filter(vm =>
                            vm.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
                            vm.systemName?.toLowerCase().includes(event.target.value.toLowerCase()) ||
                            vm.ip?.toLowerCase().includes(event.target.value.toLowerCase())))
                    }
                }
            }
            }
            columns={columns}
            dataSource={vmShownList}
            search={false}
            loading={loading}
            headerTitle="虚拟机列表"
        />
        <Modal title="虚拟机详情" open={isVmDetailModalOpen} onOk={() => setIsVmDetailModalOpen(false)} onCancel={() => setIsVmDetailModalOpen(false)}>
            <ProDescriptions column={1}>
                <ProDescriptions.Item label="名称">{currentVm?.name}</ProDescriptions.Item>
                <ProDescriptions.Item label="使用须知"><a href="https://scs.buaa.edu.cn/doc/01_common/virtual_machine_help/" target="_blank" rel="noreferrer">虚拟机使用说明</a></ProDescriptions.Item>
                <ProDescriptions.Item label="登录用户名"> buaa  或  root </ProDescriptions.Item>
                <ProDescriptions.Item label="默认登录密码"> &shieshuyuan21 </ProDescriptions.Item>
            </ProDescriptions>
        </Modal>
    </>)
}