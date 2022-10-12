import {ImageListTable} from "./ImageListTable";
import {useParams} from "react-router-dom";
import {ImageBuildTaskListTable} from "./ImageBuildTaskListTable";
import {Card, Image} from "antd";
import dockerSvg from '../../assets/docker.svg'


export const Images = () => {
    const projectId = useParams().projectId ?? '0'
    return (
        <Card title={
            (
                <>
                    <h3>
                        <Image src={dockerSvg} width={40}/> &nbsp;镜像服务
                    </h3>
                </>
            )
        }>
            <ImageListTable projectId={projectId}/>
            <ImageBuildTaskListTable projectId={projectId}/>
        </Card>
    )
}
