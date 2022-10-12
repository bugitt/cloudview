import {ImageListTable} from "./ImageListTable";
import {useParams} from "react-router-dom";
import {ImageBuildTaskListTable} from "./ImageBuildTaskListTable";

export const Images = () => {
    const projectId = useParams().projectId ?? '0'
    return (
        <div>
            <ImageListTable projectId={projectId}/>
            <ImageBuildTaskListTable projectId={projectId}/>
        </div>
    )
}
