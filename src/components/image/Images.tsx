import {ImageListTable} from "./ImageListTable";
import {useParams} from "react-router-dom";
import {ImageBuildTaskListTable} from "./ImageBuildTaskListTable";
import {Card} from "antd";
import dockerSvg from '../../assets/docker.svg'


export const Images = () => {
    const projectId = useParams().projectId ?? '0'
    return (
        <Card title={
            (
                <>
                    <h3>
                        <img src={dockerSvg} width={40} alt=''/> &nbsp;镜像服务
                    </h3>
                </>
            )
        }>
            <ImageListTable projectId={projectId}/>
            <ImageBuildTaskListTable projectId={projectId}/>
        </Card>
    )
}
