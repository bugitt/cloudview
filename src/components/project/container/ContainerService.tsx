import { ContainerServiceListTable } from './ContainerServiceListTable'
import containerSvg from '../../../assets/container.svg'
import { ProjectSubService } from '../ProjectSubService'

export const ContainerService = () => {
    return (
        <ProjectSubService title="容器服务" iconImageSrc={containerSvg}>
            <ContainerServiceListTable />
        </ProjectSubService>
    )
}
