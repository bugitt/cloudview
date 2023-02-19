import { ModalForm, ProFormCheckbox, ProFormInstance, ProFormRadio, ProFormSwitch } from "@ant-design/pro-components"
import { useRequest } from "ahooks"
import { Button, FormInstance } from "antd"
import { useRef, useState } from "react"
import { CreateVmApplyResponse, UserModel, VirtualMachine } from "../../cloudapi-client"
import { cloudapiClient } from "../../utils/cloudapi"
import { messageInfo } from "../../utils/notification"

interface Props {
    experimentId: number
    existingVmStudentIdList: string[]
    vmApply: CreateVmApplyResponse
}

export function AddVmIntoApplyForm(props: Props) {
    const { experimentId, vmApply } = props
    const [studentList, setStudentList] = useState<UserModel[]>([])

    const studentListReq = useRequest(async () => {
        const experiment = (await cloudapiClient.getExperimentExperimentId(experimentId)).data
        return (await cloudapiClient.getCourseCourseIdSimpleStudents(experiment.course.id)).data.filter(student => {
            return !props.existingVmStudentIdList.includes(student.id)
        })
    }, {
        onSuccess: (studentList) => {
            setStudentList(studentList)
        }
    })

    const formRef = useRef<ProFormInstance>()
    return (<>
        <ModalForm
            formRef={formRef}
            title="添加虚拟机"
            trigger={<Button type="primary">为其他学生添加虚拟机</Button>}
            onFinish={async (values) => {
                const studentIdList = values.studentIdList as string[]
                try {
                    await cloudapiClient.patchVmsApplyVms(vmApply.id, { studentIdList: studentIdList })
                    messageInfo("添加虚拟机成功")
                    studentListReq.run()
                    return true
                } catch (_) {
                    return false
                }
            }}
        >
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
        </ModalForm>
    </>)
}