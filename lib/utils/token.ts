import cookie from 'js-cookie'
import { GetServerSidePropsContext, NextApiRequest } from 'next'

export function ssrToken(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return ctx.query?.token as string ??
        cookies['scs-token'] ??
        cookies['token'] ?? ''
}

export function ssrUserId(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return ctx.query?.userId as string ??
        cookies['userId'] ??
        cookies['scs-userId'] ?? ''
}

export function getTokenFromReq(req: NextApiRequest): string {
    return req.cookies["scs-token"] ?? req.cookies["token"] ?? req.headers["Authorization"]?.at(0) ?? req.headers["authorization"]?.at(0) ?? ""
}

export const getToken = () =>
    cookie.get('scs-token') ??
    cookie.get('token') ??
    ''

export const getUserId = () =>
    cookie.get('userId') ??
    cookie.get('scs-userId') ??
    // new URLSearchParams(window.location.search).get('userId') ??
    ''

export const setToken = (token?: string, userId?: string) => {
    const options = {
        expires: 365,
    }
    const finalToken = token ? token : getToken()
    const finalUserId = userId ? userId : getUserId()
    cookie.set('scs-token', finalToken, options)
    cookie.set('scs-userId', finalUserId, options)
}
