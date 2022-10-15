import { Tag } from 'antd'

interface TaskStatusTagProps {
    status: string
}

export const TaskStatusTag = (props: TaskStatusTagProps) => {
    let content: string = ''
    let color: string = ''
    switch (props.status.toLowerCase()) {
        case 'undo':
            content = '排队中'
            color = 'geekblue'
            break
        case 'doing':
            content = '运行中'
            color = 'orange'
            break
        case 'success':
            content = '完成'
            color = 'green'
            break
        case 'fail':
            content = '失败'
            color = 'red'
            break
    }
    return <Tag color={color}>{content}</Tag>
}
