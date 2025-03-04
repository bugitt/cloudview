import { GetStaticProps, InferGetStaticPropsType } from "next"
import { VmApplyListTable } from "../lib/components/vm/VmApplyListTable"
import { VmListTable } from "../lib/components/vm/VmListTable"
import WMKSPage from "../lib/components/vm/VmWebConsole"
import { cloudapiClient } from "../lib/utils/cloudapi"
import { setUserInfo, staticUserInfoFromQueryParams } from "../lib/utils/token"

export default function VmManagement(props: InferGetStaticPropsType<typeof getStaticProps>) {
    if (typeof window === 'undefined') {
        return (<></>)
    }
    const params = new URLSearchParams(window?.location.search)
    const userInfo = staticUserInfoFromQueryParams(params)
    setUserInfo(userInfo)
    const fetchVmList = (experimentId?: number) => {
        if (experimentId) {
            return cloudapiClient.getVmExperimentVms(true, experimentId).then((res) => res.data)
        }
        const role = userInfo.role
        if (role.toLowerCase() === "student") {
            return Promise.all([
                cloudapiClient.getVmPersonalVms().then((res) => res.data),
                cloudapiClient.getVmExperimentVms(false).then((res) => res.data),
            ]).then((res) => res.flat())
        } else if (role.toLowerCase().includes("admin")) {
            return cloudapiClient.getVms().then((res) => res.data)
        } else {
            return cloudapiClient.getVmPersonalVms().then((res) => res.data)
        }
    }
    const experimentId = params.get('experimentId') ? Number(params.get('experimentId')) : undefined

    let studentId = undefined
    let teacherId = undefined
    let isAdmin = false
    if (userInfo.role.toLowerCase() === "student") {
        studentId = userInfo.userId
    } else if (userInfo.role.toLowerCase().includes("admin")) {
        isAdmin = true
    } else {
        teacherId = userInfo.userId
    }


    return (
        <>
            <VmListTable fetchVmList={fetchVmList}
                studentId={studentId}
                teacherId={teacherId}
                experimentId={experimentId}
                isAdmin={isAdmin}
            />
            <VmApplyListTable isAdmin={isAdmin} experimentId={experimentId} />
        </>
    )
}

export const getStaticProps: GetStaticProps<any> = async (ctx) => {
    return {
        props: {},
    }
}