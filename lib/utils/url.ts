export function removeAuthFromUrl(url: string): string {
    const u = new URL(url)
    u.username = ""
    u.password = ""
    return u.href
}