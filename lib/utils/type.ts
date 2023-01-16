import React from 'react'
import { DefaultApi, DefaultApiFactory } from '../cloudapi-client'
import { UserInfo } from './token'

export type ReactKeyType = {
    key: React.Key
}

export type BaseSSRType = {
    userInfo: UserInfo
}