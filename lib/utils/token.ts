import cookie from 'js-cookie'
import { GetServerSidePropsContext } from 'next'

export function ssrToken(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return cookies['scs-token'] ??
        cookies['token'] ??
        ctx.query?.token as string ?? ''
}

export function ssrUserId(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return cookies['userId'] ??
        cookies['scs-userId'] ??
        ctx.query?.userId as string ?? ''
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
