import React, { useState } from 'react'
import { Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { getToken } from '../../utils'
import { FileResponse, UploadFileResponse } from '../../cloudapi-client'

interface UploadFileProps {
    fileType: string
    owner: string
    involvedId: string
    maxCount: number
    fileListProcessHook: (fileList: FileResponse[]) => void
}

export const FileUpload = (props: UploadFileProps) => {
    const actionURL = new URL('https://scs.buaa.edu.cn/api/v2/file')
    actionURL.searchParams.append('fileType', props.fileType)
    actionURL.searchParams.append('owner', props.owner)
    actionURL.searchParams.append('involvedId', props.involvedId)
    actionURL.searchParams.append('token', getToken())

    const [_, setFileList] = useState<UploadFile<UploadFileResponse>[]>([])

    const handleChange: UploadProps<UploadFileResponse>['onChange'] = info => {
        let newFileList = [...info.fileList]
        newFileList = newFileList.map(file => {
            if (file.response) {
                // Component will show file.url as link
                const url = new URL(
                    file.response.files?.at(0)?.downloadLink ?? ''
                )
                url.searchParams.append('token', getToken())
                file.url = url.href
            }
            return file
        })
        setFileList(newFileList)
        props.fileListProcessHook(
            (
                newFileList
                    .map(file => file.response?.files)
                    .filter(files => files !== undefined) as FileResponse[][]
            ).flat()
        )
    }

    return (
        <Upload
            action={actionURL.href}
            maxCount={props.maxCount}
            onChange={handleChange}
        >
            <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
    )
}
