import cookie from 'js-cookie'

type CookieKey = 'token' | 'userId'

const getFromCookie = (key: CookieKey) =>
    cookie.get(`scs-${key}`) ?? cookie.get(key) ?? undefined

const getFromCookieOrParams = (key: CookieKey) => {
    const value = getFromCookie(key)
    return value ?? new URLSearchParams(window.location.search).get(key) ?? ''
}

export const getToken = () => getFromCookieOrParams('token')

export const getTokenFromCookie = () => getFromCookie('token')

export const getUserId = () => getFromCookieOrParams('userId')

export const getUserIdFromCookie = () => getFromCookie('userId')

export const setToken = (token?: string, userId?: string) => {
    const options = {
        expires: 2
    }
    const finalToken = token ? token : getToken()
    const finalUserId = userId ? userId : getUserId()
    cookie.set('scs-token', finalToken, options)
    cookie.set('scs-userId', finalUserId, options)
}
