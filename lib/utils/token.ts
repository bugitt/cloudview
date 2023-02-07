import cookie from 'js-cookie'
import { GetServerSidePropsContext, NextApiRequest } from 'next'

export interface UserInfo {
    token: string
    userId: string
    role: string
}

export function ssrUserInfo(ctx: GetServerSidePropsContext): UserInfo {
    return {
        token: ssrToken(ctx),
        userId: ssrUserId(ctx),
        role: ssrRole(ctx),
    }
}

function ssrToken(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return ctx.query?.token as string ??
        cookies['scs-token'] ??
        cookies['token'] ?? ''
}

function ssrUserId(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return ctx.query?.userId as string ??
        cookies['userId'] ??
        cookies['scs-userId'] ?? ''
}

function ssrRole(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return ctx.query?.role as string ??
        cookies['role'] ??
        cookies['scs-role'] ?? ''
}

export function getTokenFromReq(req: NextApiRequest): string {
    return req.cookies["scs-token"] ?? req.cookies["token"] ?? req.headers["Authorization"]?.at(0) ?? req.headers["authorization"]?.at(0) ?? ""
}

export const getToken = () =>
    cookie.get('scs-token') ??
    cookie.get('token') ??
    ''

export const getUserId = () =>
    cookie.get('scs-userId') ??
    cookie.get('userId') ??
    // new URLSearchParams(window.location.search).get('userId') ??
    ''

export const setUserInfo = (userInfo: UserInfo) => {
    const options = {
        expires: 365,
    }
    userInfo.token !== '' && cookie.set('scs-token', userInfo.token, options)
    userInfo.userId !== '' && cookie.set('scs-userId', userInfo.userId, options)
    userInfo.role !== '' && cookie.set('scs-role', userInfo.role)
}
