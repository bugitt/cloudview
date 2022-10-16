import { Card } from 'antd'
import React from 'react'

export interface ProjectSubServiceProps {
    title: string
    iconImageSrc: string
    children?: React.ReactNode
}

export const ProjectSubService: React.FC<ProjectSubServiceProps> = ({
    title,
    iconImageSrc,
    children
}) => {
    return (
        <Card
            title={
                <>
                    <h4>
                        <img src={iconImageSrc} width={40} alt={title} />
                        &nbsp; {title}
                    </h4>
                </>
            }
        >
            {children}
        </Card>
    )
}
