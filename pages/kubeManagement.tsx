import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { setUserInfo, ssrUserInfo } from "../lib/utils/token"
import { BaseSSRType } from "../lib/utils/type"
import { KubeManagementPage } from "../lib/kube/KubeManagementPage"
import { listAllNS } from "../lib/kube/core"

interface Props extends BaseSSRType {
    namespaceList: string[]
}

export default function KubeManagement(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    if (typeof window === 'undefined') {
        return (<></>)
    }

    const { userInfo } = props
    setUserInfo(userInfo)
    return (
        <>
            <KubeManagementPage allNamespaceList={props.namespaceList} />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    const nsList = await listAllNS()
    return {
        props: {
            userInfo: userInfo,
            namespaceList: nsList,
        },
    }
}