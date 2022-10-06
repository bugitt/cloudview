import React from "react";
import ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import "./index.less";
import Image from "./Image";

const router = createBrowserRouter([
    {
        path: "/image",
        element: <Image />,
    }
], {
    basename: "/view/v2",
});

const root = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
