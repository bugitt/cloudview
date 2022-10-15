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
