import { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { LogRecordTable } from "../lib/components/logs/LogRecordTable"
import { setUserInfo, ssrUserInfo } from "../lib/utils/token"
import { BaseSSRType } from "../lib/utils/type"

interface Props extends BaseSSRType {
}

export default function LogManagement(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { userInfo } = props
    setUserInfo(userInfo)
    return (
        <>
            <LogRecordTable />
        </>
    )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const userInfo = ssrUserInfo(ctx)
    return {
        props: {
            userInfo: userInfo,
        },
    }
}