import {ImageListTable} from "./ImageListTable";
import {useParams} from "react-router-dom";

export const Images = () => {
    const projectId = useParams().projectId ?? '0'
    return (
        <div>
            <ImageListTable projectId={projectId}/>
        </div>
    )
}
