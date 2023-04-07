export const randomString = (length: number) => {
    let result = ''
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i += 1) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        )
    }
    return result
}

export const randomStringStrongWithCapital = (length: number) => {
    let result = ''

    const characters = 'abcdefghijklmnopqrstuvwxyz'
    const capitalLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const digits = '0123456789'

    for (let i = 0; i < length; i += 3) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        )
        result += capitalLetters.charAt(
            Math.floor(Math.random() * capitalLetters.length)
        )
        result += digits.charAt(Math.floor(Math.random() * digits.length))
    }
    return result.slice(0, length)
}