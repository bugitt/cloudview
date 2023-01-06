import md5 from 'md5'
import { crdDisplayStatus } from '../models/crd'

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

export function crdStatusColor(status: crdDisplayStatus): string {
    switch (status) {
        case '未调度':
            return 'volcano'
        case '排队中':
            return 'geekblue'
        case '进行中':
            return 'blue'
        case '成功完成':
            return 'green'
        case '任务失败':
            return 'red'
        case '运行中':
            return 'cyan'
        case '未知状态':
            return 'magenta'
    }
}
