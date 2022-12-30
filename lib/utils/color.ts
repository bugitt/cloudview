import md5 from 'md5'

const colors: string[] = [
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'geekblue',
    'purple',
    'magenta'
]

export function randomColor(text: string): string {
    const r = parseInt(md5(text).slice(0, 2), 16) % colors.length
    return colors.at(r) ?? 'geekblue'
}
