import React from 'react'
import { DefaultApi, DefaultApiFactory } from '../cloudapi-client'

export type ReactKeyType = {
    key: React.Key
}

export type BaseSSRType = {
    token: string
    userId: string
}

export type NetworkComponentPropsType = {
    client: ReturnType<typeof DefaultApiFactory>
}