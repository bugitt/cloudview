import ReactECharts from 'echarts-for-react'
import { StatDataType } from './ResourceStatCard'

export const ResourcePoolCpuStat = (props: {
    data: StatDataType[]
    type: 'cpu' | 'memory'
}) => {
    const { data, type } = props
    const option = {
        title: {
            text:
                type === 'cpu'
                    ? 'CPU使用情况统计（mCore）'
                    : '内存使用情况统计（MB）',
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
        series: [
            {
                name: `${type === 'cpu' ? 'CPU' : '内存'}使用情况统计`,
                type: 'pie',
                radius: '50%',
                data: data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    }

    return <ReactECharts option={option} />
}
