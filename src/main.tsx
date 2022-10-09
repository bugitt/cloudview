import React from "react";
import ReactDOM from "react-dom/client";
import {createBrowserRouter, RouterProvider,} from "react-router-dom";
import "./index.less";
import {Images} from "./components/image";


const router = createBrowserRouter([
    {
        path: "/project/:projectId/image",
        element: <Images/>,
    }
], {
    basename: "/view/v2",
});

const root = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>
);
