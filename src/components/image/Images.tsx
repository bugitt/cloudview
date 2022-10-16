import { ImageListTable } from './ImageListTable'
import { useParams } from 'react-router-dom'
import { ImageBuildTaskListTable } from './ImageBuildTaskListTable'
import dockerSvg from '../../assets/docker.svg'
import { ProjectSubService } from '../project/ProjectSubService'

export const ImageService = () => {
    const projectId = useParams().projectId ?? '0'
    return (
        <ProjectSubService title="镜像服务" iconImageSrc={dockerSvg}>
            <ImageListTable projectId={projectId} />
            <ImageBuildTaskListTable projectId={projectId} />
        </ProjectSubService>
    )
}
