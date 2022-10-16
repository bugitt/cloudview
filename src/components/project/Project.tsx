import { ContainerService } from '../container/ContainerService'
import { ImageService } from '../image/Images'

export const Project = () => {
    return (
        <>
            <ImageService />
            <ContainerService />
        </>
    )
}
