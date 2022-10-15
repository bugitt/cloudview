export const projectNameExtraInfo = `仅允许包含小写字母、数字、'-'，且必须以小写字母开头，并以小写字母或数字结尾。`

export const isValidProjectName = (name: string): Boolean => {
    return /^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name)
}

export const formItemProjectNameValidator = (srcValue: any) => {
    const value = String(srcValue)
    if (!isValidProjectName(value)) {
        return Promise.reject(`名称格式非法`)
    }
    return Promise.resolve()
}
