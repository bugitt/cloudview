import { ModalForm, ProFormCheckbox, ProFormDatePicker, ProFormDigit, ProFormGroup, ProFormInstance, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProSchemaValueEnumObj } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button } from "antd";
import moment from "moment";
import { useRef, useState } from "react";
import { CreateVmApplyRequest, UserModel, VirtualMachineTemplate } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";

interface Props {
    title: string
    onOk: () => void
    studentId?: string
    teacherId?: string
    experimentId?: number
}

interface DataType {
    name: string
    templateUuid: string
    diskSize: number
    memory: number
    cpu: number
    dueTime: string
    description: string
    studentIdList: string[]
}

export function VmApplyForm(props: Props) {

    const [templateList, setTemplateList] = useState<VirtualMachineTemplate[]>([])
    useRequest(cloudapiClient.getVmTemplates, {
        onSuccess: (templateList) => {
            setTemplateList(templateList.data)
        }
    })
    const getTemplateListEnumObj = (templateList: VirtualMachineTemplate[]) => {
        const obj: ProSchemaValueEnumObj = {}
        templateList.forEach(template => {
            obj[template.uuid] = template.name
        })
        return obj
    }

    const [studentList, setStudentList] = useState<UserModel[]>([])
    const studentListReq = useRequest(async () => {
        if (!props.experimentId) {
            return []
        }
        const experiment = (await cloudapiClient.getExperimentExperimentId(props.experimentId)).data
        return (await cloudapiClient.getCourseCourseIdSimpleStudents(experiment.course.id)).data
    }, {
        onSuccess: (studentList) => {
            setStudentList(studentList)
        }
    })

    const onFinish = async (values: DataType) => {
        const req: CreateVmApplyRequest = {
            studentId: props.experimentId ? undefined : props.studentId,
            teacherId: props.experimentId ? undefined : props.teacherId,
            experimentId: props.experimentId,
            cpu: values.cpu,
            memory: values.memory * 1024,
            diskSize: values.diskSize * 1024 * 1024 * 1024,
            dueTime: moment(values.dueTime).unix() * 1000,
            namePrefix: values.name,
            description: values.description,
            templateUuid: values.templateUuid,
            studentIdList: values.studentIdList,
        }
        try {
            await cloudapiClient.postVmsApply(req)
            props.onOk()
            return true
        } catch (_) {
            return false
        }
    }

    const formRef = useRef<ProFormInstance>()

    return (
        <>
            <ModalForm
                formRef={formRef}
                title={props.title}
                trigger={<Button type="primary">{props.title}</Button>}
                onFinish={onFinish}
            >
                <ProFormText
                    label="虚拟机名称"
                    name="name"
                    rules={[{ required: true, message: '请输入虚拟机名称' }]}
                />

                <ProFormSelect
                    name="templateUuid"
                    label="模板名称"
                    valueEnum={getTemplateListEnumObj(templateList)}
                    placeholder="请选择模板"
                    width={350}
                    rules={[
                        {
                            required: true,
                        }
                    ]}
                />

                <ProFormDigit
                    name="cpu"
                    label="CPU核数"
                    min={1}
                    max={128}
                    addonAfter="核"
                    rules={[{ required: true }]}
                />
                <ProFormDigit
                    name="memory"
                    label="内存大小"
                    min={1}
                    max={128}
                    addonAfter="GB"
                    rules={[{ required: true }]}
                />
                <ProFormDigit
                    name="diskSize"
                    label="磁盘容量"
                    min={1}
                    max={128}
                    addonAfter="GB"
                    rules={[{ required: true }]}
                />

                <ProFormDatePicker
                    label="虚拟机使用截止日期"
                    name="dueTime"
                    rules={[{ required: true, message: '请输入虚拟机使用截止时间' }]}
                />

                <ProFormTextArea
                    label="申请理由"
                    name="description"
                    rules={[{ required: true, message: '请输入申请理由' }]}
                />

                <ProFormGroup title="选择需要添加虚拟机的学生">
                    <ProFormSwitch name="all" label="全选"
                        checkedChildren="全选"
                        unCheckedChildren="全不选"
                        fieldProps={{
                            onChange: (e) => {
                                if (e) {
                                    formRef.current?.setFieldValue("studentIdList", studentList.map(student => student.id))
                                } else {
                                    formRef.current?.setFieldValue("studentIdList", [])
                                }
                            },
                        }}
                    />
                    <ProFormCheckbox.Group
                        name="studentIdList"
                        label="学生列表"
                        layout="vertical"
                        options={studentList.map(student => {
                            return { label: `${student.id} ${student.name}`, value: student.id }
                        })}
                        required
                    />
                </ProFormGroup>

            </ModalForm>
        </>
    )
}