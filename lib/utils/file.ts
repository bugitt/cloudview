import { FileResponse } from "../cloudapi-client"

export type AntdUploadResponse = {
    response: {
        files: FileResponse[]
    }
}