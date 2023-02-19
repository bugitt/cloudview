import { GetStaticProps, InferGetStaticPropsType } from "next"
import { VmApplyListTable } from "../lib/components/vm/VmApplyListTable"
import { setUserInfo, staticUserInfoFromQueryParams } from "../lib/utils/token"

export default function VmApplyManagement(props: InferGetStaticPropsType<typeof getStaticProps>) {
    if (typeof window === 'undefined') {
        return (<></>)
    }
    const params = new URLSearchParams(window?.location.search)
    const userInfo = staticUserInfoFromQueryParams(params)
    setUserInfo(userInfo)
    const experimentId = params.get('experimentId') ? Number(params.get('experimentId')) : undefined

    let isAdmin = false
    if (userInfo.role.toLowerCase().includes("admin")) {
        isAdmin = true
    }


    return (
        <>
            <VmApplyListTable isAdmin={isAdmin} experimentId={experimentId} />
        </>
    )
}

export const getStaticProps: GetStaticProps<any> = async (ctx) => {
    return {
        props: {},
    }
}