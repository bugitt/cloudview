import { ContainerServiceListTable } from './ContainerServiceListTable'
import containerSvg from '../../../assets/container.svg'
import { ProjectSubService } from '../ProjectSubService'
import { useParams } from 'react-router-dom'
import { Project } from '../../../cloudapi-client'

export const ContainerService = (props: { project?: Project }) => {
    return (
        <ProjectSubService title="容器服务" iconImageSrc={containerSvg}>
            <ContainerServiceListTable project={props.project} />
        </ProjectSubService>
    )
}
