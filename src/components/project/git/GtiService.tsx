import { ProjectSubService } from '../ProjectSubService'
import gitSvg from '../../../assets/git.svg'
import { RepositoryListTable } from './RepositoryListTable'
import { useParams } from 'react-router-dom'

export const GitService = () => {
    const projectId = useParams().projectId ?? '0'
    return (
        <ProjectSubService title="代码仓库" iconImageSrc={gitSvg}>
            <RepositoryListTable projectId={projectId} />
        </ProjectSubService>
    )
}
