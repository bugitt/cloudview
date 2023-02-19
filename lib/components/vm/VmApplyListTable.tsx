import { ModalForm, ProColumns, ProDescriptions, ProFormSwitch, ProFormTextArea, ProTable } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Modal, Space, Tag, Typography } from "antd"
import { useState } from "react"
import { CreateVmApplyResponse } from "../../cloudapi-client"
import { cloudapiClient } from "../../utils/cloudapi"
import { messageInfo, notificationError } from "../../utils/notification"

interface Props {
    experimentId?: number
    isAdmin: boolean
}

interface DataType {
    key: React.Key
    name: string
    applicant: string
    applyType: string
    applyTime: number
    dueTime?: number
    status: number
    handleTime?: number
    process?: number
    vmApply: CreateVmApplyResponse
}

function getVmApplyState(status: number) {
    switch (status) {
        case 0:
            return <Tag color="processing">待审核</Tag>
        case 1:
            return <Tag color="success">已通过</Tag>
        case 2:
            return <Tag color="error">未通过</Tag>
    }
}

export function VmApplyListTable(props: Props) {
    const [currentVmApply, setCurrentVmApply] = useState<CreateVmApplyResponse | undefined>(undefined)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [vmApplyList, setVmApplyList] = useState<DataType[]>([])
    const vmApplyListReq = useRequest(() => { return cloudapiClient.getVmsApply(props.experimentId) }, {
        onSuccess: (vmApplyList) => {
            const data: DataType[] = vmApplyList.data.map((vmApply, index) => {
                const item: DataType = {
                    key: index,
                    name: vmApply.namePrefix,
                    applicant: `${vmApply.applicant.id}(${vmApply.applicant.name})`,
                    applyType: vmApply.experimentId == 0 ? "创建" : "批量创建",
                    applyTime: vmApply.applyTime,
                    dueTime: vmApply.dueTime,
                    status: vmApply.status,
                    handleTime: vmApply.handleTime,
                    process: vmApply.status === 1 ? (vmApply.process.actual / vmApply.process.wanted) * 100 : undefined,
                    vmApply: vmApply,
                }
                return item
            })
            setVmApplyList(data)
        },
        onError: (_) => {
            notificationError("获取虚拟机申请列表失败")
        },
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
            title: "申请人",
            dataIndex: "applicant",
            key: "applicant",
            valueType: 'text',
        },
        {
            title: "申请类型",
            dataIndex: "applyType",
            key: "applyType",
            valueType: 'text',
        },
        {
            title: "申请时间",
            dataIndex: "applyTime",
            key: "applyTime",
            valueType: 'date',
        },
        {
            title: "虚拟机到期时间",
            dataIndex: "dueTime",
            key: "dueTime",
            valueType: 'date',
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            render: (_, record) => {
                return getVmApplyState(record.status)
            }
        },
        {
            title: "审批时间",
            dataIndex: "handleTime",
            key: "handleTime",
            valueType: 'date',
        },
        {
            title: "创建进度",
            dataIndex: "process",
            key: "process",
            valueType: 'progress',
        },
        {
            title: "操作",
            valueType: 'option',
            key: "option",
            render: (_, record) => {
                return <>
                    <Space>
                        <a onClick={() => {
                            setCurrentVmApply(record.vmApply)
                            setDetailModalOpen(true)
                        }}>{props.isAdmin ? '详情' : "详情及审批意见"}</a>

                        {
                            record.status === 0 && props.isAdmin &&
                            <>
                                <ModalForm title="审批"
                                    trigger={<Typography.Link>审批</Typography.Link>}
                                    onFinish={async (values: any) => {
                                        console.log(values)
                                        try {
                                            await cloudapiClient.approveVmsApply(record.vmApply.id, values.isPass as boolean, values.replyMsg ? values.replyMsg : '')
                                            messageInfo("审批完成")
                                            vmApplyListReq.run()
                                            return true
                                        } catch (_) {
                                            return false
                                        }
                                    }}>
                                    <ProFormSwitch
                                        name="isPass"
                                        label="是否通过"
                                        checkedChildren="通过"
                                        unCheckedChildren="不通过"
                                        rules={[{ required: true, message: '请选择是否通过' }]}
                                    />
                                    <ProFormTextArea
                                        name="replyMsg"
                                        label="审批意见"
                                        placeholder="请输入审批意见"
                                    />
                                </ModalForm>
                            </>
                        }
                    </Space>

                </>
            }
        }
    ]

    return (<>
        <ProTable<DataType>
            options={{
                reload: () => { vmApplyListReq.run() }
            }}
            columns={columns}
            dataSource={vmApplyList}
            search={false}
            loading={vmApplyListReq.loading}
            headerTitle="申请记录"
        />
        <Modal title="虚拟机详情" open={detailModalOpen} onOk={() => setDetailModalOpen(false)} onCancel={() => setDetailModalOpen(false)}>
            <ProDescriptions column={1}>
                <ProDescriptions.Item label="模板名称">{currentVmApply?.templateName}</ProDescriptions.Item>
                <ProDescriptions.Item label="CPU数目">{currentVmApply?.cpu}</ProDescriptions.Item>
                <ProDescriptions.Item label="内存（GB）">{currentVmApply?.memory ? currentVmApply.memory / 1024 : undefined}</ProDescriptions.Item>
                <ProDescriptions.Item label="磁盘大小（GB）">{currentVmApply?.diskSize ? currentVmApply.diskSize / 1024 / 1024 / 1024 : undefined}</ProDescriptions.Item>
                <ProDescriptions.Item label="虚拟机数目"> {currentVmApply?.experimentId !== 0 ? currentVmApply?.studentIdList.length : 1} </ProDescriptions.Item>
                <ProDescriptions.Item label="申请原因"> {currentVmApply?.description} </ProDescriptions.Item>
                <ProDescriptions.Item label="审批意见">{currentVmApply?.replyMsg} </ProDescriptions.Item>
            </ProDescriptions>
        </Modal>
    </>)
}
