import { getTokenFromCookie } from '../utils'
import { Login } from './Login'
import React from 'react'

export const App: React.FC = () => {
    if (!getTokenFromCookie()) {
        return <Login />
    }
    return <></>
}
