import { LoadingOutlined, DownOutlined } from "@ant-design/icons";
import { ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import type { MenuProps } from 'antd';
import { Button, Modal, Popconfirm, Space, Typography, Input, Dropdown, Menu } from "antd";
import { useState, ChangeEvent, useEffect, useRef } from "react";
import { CreateVmApplyResponse, ExperimentResponse, VirtualMachine, VmNetInfo } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";
import { messageError, messageInfo, notificationError } from "../../utils/notification";
import { AddVmIntoApplyForm } from "./AddVmIntoApplyForm";
import { VmApplyForm } from "./VmApplyForm";
import WMKSPage, { WMKSPageRef } from "./VmWebConsole";
import axios from "axios";
import { BASE_PATH } from "../../cloudapi-client/base";

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
            if (ip.startsWith("10.251.")) {
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
    const [showConsole, setShowConsole] = useState(false);
    const [consoleProps, setConsoleProps] = useState<{host: string, ticket: string} | null>(null);
    const [inputText, setInputText] = useState('');
    const wmksRef = useRef<WMKSPageRef>(null);

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
                try {
                    const experiment = await (await cloudapiClient.getExperimentExperimentId(expId)).data
                    expIdMap.set(expId, experiment)
                } catch (e) {
                    console.error(`failed in request experiment info with id ${expId}.`)
                }
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

    useEffect(() => {
        const intervalId = setInterval(() => {
            vmListReq.run();
        }, 10000); // 每10秒执行一次

        // 清除定时器
        return () => clearInterval(intervalId);
    }, [vmListReq]); 

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
            width: 120,
            render: (_, record) => {
                const menuItems: MenuProps['items'] = [
                    {
                        key: 'poweron',
                        disabled: record.state !== 'stopped',
                        label: (
                            <Typography.Link style={record.state !== 'stopped' ? {} : { color: '#1677ff' }}
                                onClick={() => {
                                    cloudapiClient.patchVmVmIdPower(record.vm.id, "poweron")
                                    messageInfo('成功提交开机任务')
                                    vmListReq.run()
                                }}
                            >开机</Typography.Link>
                        )
                    },
                    {
                        key: 'poweroff',
                        disabled: record.state !== 'running',
                        label: (
                            <Typography.Link style={record.state !== 'running' ? {} : { color: '#1677ff' }}
                                onClick={() => {
                                    cloudapiClient.patchVmVmIdPower(record.vm.id, "poweroff")
                                    messageInfo('成功提交关机任务')
                                    vmListReq.run()
                                }}
                            >关机</Typography.Link>
                        )
                    },
                    {
                        key: 'console',
                        disabled: record.state !== 'running',
                        label: (
                            <Typography.Link style={record.state !== 'running' ? {} : { color: '#1677ff' }}
                                onClick={async () => {
                                    if (record.vm.platform == 'sangfor') {
                                        // TODO: 硬编码axios，期望重生成 CloudApiClient
                                        const response = await axios.get(`${BASE_PATH}/vm/sangfor/${record.vm.uuid}/console`)
                                        if (response.status != 200) {
                                            messageError('打开控制台失败：' + response.data)
                                            return
                                        }
                                        console.log("成功获取深信服url: " + response.data)
                                        window.open(response.data, "_blank")
                                        return
                                    }
                                    cloudapiClient.postVmVmIdTicket(record.vm.uuid || "").then(res => {
                                        setConsoleProps({
                                            host: res.data.host,
                                            ticket: res.data.ticket
                                        });
                                        setShowConsole(true);
                                    })
                                }}
                            >打开控制台</Typography.Link>
                        )
                    },
                    {
                        key: 'template',
                        disabled: record.state !== 'stopped',
                        label: (
                            <Popconfirm
                                title="确认转换为模板？"
                                description={`转换后该虚拟机会变为模板，请到“虚拟机模板”页查看`}
                                onConfirm={() => {
                                    cloudapiClient.postVmTemplate({uuid: record.vm.uuid, name: record.name})
                                    messageInfo('转换虚拟机模板成功')
                                    vmListReq.run()
                                }}
                                okText="确认"
                                cancelText="取消"
                            >
                                <Typography.Link style={record.state !== 'stopped' ? {} : { color: '#1677ff' }}>
                                    转换为模板
                                </Typography.Link>
                            </Popconfirm>
                        )
                    },
                    {
                        type: 'divider',
                    },
                    {
                        key: 'delete',
                        label: (
                            <Popconfirm
                                title="删除虚拟机"
                                description={`确定要删除虚拟机 ${record.name} 吗？`}
                                onConfirm={async () => {
                                    const templates = (await cloudapiClient.getVmTemplates()).data
                                    if (templates.some(template => template.uuid === record.vm.uuid)) {
                                        // pop up another confirmation if the vm is also a template
                                        Modal.confirm({
                                            title: `虚拟机 ${record.name} 同时也是一个模板`,
                                            content: `该虚拟机同时也是一个模板，是否真的要删除此虚拟机？如果删除，相关模板也会被删除。`,
                                            okText: '删除模板',
                                            cancelText: '保留模板',
                                            onOk: async () => {
                                                await cloudapiClient.deleteVmVmId(record.vm.id)
                                                messageInfo('成功提交删除任务')
                                            },
                                            onCancel: () => {
                                                // do nothing, just close the confirmation
                                            }
                                        });
                                        return;
                                    }

                                    await cloudapiClient.deleteVmVmId(record.vm.id)
                                    messageInfo('成功提交删除任务')
                                }}
                                okText="是"
                                cancelText="否"
                            >
                                <Typography.Link style={{ color: '#ff4d4f' }}>删除</Typography.Link>
                            </Popconfirm>
                        )
                    }
                ];

                return <>
                    <Space>
                        <Typography.Link onClick={() => {
                            setCurrentVm(record)
                            setIsVmDetailModalOpen(true)
                        }}>详情</Typography.Link>
                        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                            <Typography.Link><Space>更多<DownOutlined /></Space></Typography.Link>
                        </Dropdown>
                    </Space>
                </>
            }
        }
    ]

    return (<>
        {showConsole ? (
            <div>
                <Space size={10}>
                    <Button onClick={() => setShowConsole(false)}>返回列表</Button>
                    <Input 
                        placeholder="要输入至虚拟机的文本" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        style={{ width: 200 }}
                    />
                    <Button onClick={() => {
                        wmksRef.current?.sendText(inputText);
                        setInputText(''); // 清空输入框
                    }}>
                        输入
                    </Button>
                    <Button onClick={() => wmksRef.current?.sendCtrlAltDel()}>
                        发送 Ctrl+Alt+Del
                    </Button>
                </Space>
                <WMKSPage 
                    ref={wmksRef}
                    key={`${consoleProps?.host}-${consoleProps?.ticket}`}
                    host={consoleProps?.host || ""}
                    ticket={consoleProps?.ticket || ""}
                />
            </div>
        ) : (
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
                                onConfirm={async () => {
                                    const templates = (await cloudapiClient.getVmTemplates()).data
                                    const templateArray = templates.filter(
                                        t => selectedVmList.some(record => record.vm.uuid === t.uuid)
                                    )

                                    const deleteVmsAsync = async () => {
                                        await Promise.all(selectedVmList.map((vm) => {
                                            return cloudapiClient.deleteVmVmId(vm.vm.id);
                                        }));
                                        messageInfo('成功提交删除任务');
                                        vmListReq.run();
                                    }

                                    if (templateArray.length === 0) {
                                        // no template involved, directly delete
                                        await deleteVmsAsync();
                                        return;
                                    }
                                    
                                    const listMessage = templateArray.map(t => t.name).join(', ');
                                    // pop up another confirmation if some vms are also templates
                                    Modal.confirm({
                                        title: "虚拟机同时是模板",
                                        content: `所选中的虚拟机中有 ${templateArray.length} 个同时也是模板（它们是：${listMessage}），是否真的要删除这些虚拟机？如果删除，相关模板也会被删除。`,
                                        okText: '删除',
                                        cancelText: '取消',
                                        onOk: async () => {
                                            await deleteVmsAsync();
                                        },
                                        onCancel: () => {
                                            // do nothing, just close the confirmation
                                        }
                                    });

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
        )}
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