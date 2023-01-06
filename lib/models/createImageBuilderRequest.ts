export interface CreateImageBuilderRequest {
    projectName: string
    imageMeta: {
        name: string
        tag: string
    }
    context: {
        git?: {
            urlWithAuth: string
            ref?: string
        }
        s3?: {
            objectKey: string
        }
        raw?: string
    }
    dockerfilePath?: string
    workspacePath?: string
}