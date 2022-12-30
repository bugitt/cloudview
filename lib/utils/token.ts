import cookie from 'js-cookie'
import { GetServerSidePropsContext } from 'next'

export function ssrToken(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return cookies['token'] ??
        cookies['scs-token'] ??
        ctx.query?.token as string ?? ''
}

export function ssrUserId(ctx: GetServerSidePropsContext): string {
    const cookies = ctx.req?.cookies
    return cookies['userId'] ??
        cookies['scs-userId'] ??
        ctx.query?.userId as string ?? ''
}

export const getToken = () =>
    '42l77l35l4fl7al75l52l4el2fl5al58l44l66l6fl4bl75l7al50l6dl38l4al72l32l59l37l39l78l37l50l43l35l54l39l62l2fl38l61l48l61l71l34l32l49l35l52l61l6al77l50l69l4bl2bl76l6dl6dl4cl77l45l50l64l4bl64l75l51l43l7al4dl41l6al64l56l36l52l78l6fl4al52l7al6bl46l46l34l35l33l55l44l55l3d'

export const getUserId = () =>
    cookie.get('userId') ??
    cookie.get('scs-userId') ??
    // new URLSearchParams(window.location.search).get('userId') ??
    ''

export const setToken = (token?: string, userId?: string) => {
    const options = {
        expires: 2
    }
    const finalToken = token ? token : getToken()
    const finalUserId = userId ? userId : getUserId()
    cookie.set('scs-token', finalToken, options)
    cookie.set('scs-userId', finalUserId, options)
}
