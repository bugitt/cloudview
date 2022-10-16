import cookie from 'js-cookie'

export const getToken = () =>
    cookie.get('token') ??
    cookie.get('scs-token') ??
    new URLSearchParams(window.location.search).get('token') ??
    ''

export const getUserId = () =>
    cookie.get('userId') ??
    cookie.get('scs-userId') ??
    new URLSearchParams(window.location.search).get('userId') ??
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
