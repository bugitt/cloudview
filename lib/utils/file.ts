import { FileResponse } from "../cloudapi-client"

export type AntdUploadResponse = {
    response: {
        files: FileResponse[]
    }
}

export const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}