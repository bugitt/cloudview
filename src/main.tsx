import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Project } from './components/project/Project'
import { Projects } from './components/project/Projects'

const router = createBrowserRouter(
    [
        {
            path: '/project/:projectId/',
            element: <Project />
        },
        {
            path: '/projects',
            element: <Projects />
        }
    ],
    {
        basename: '/view/v2'
    }
)

const root = document.getElementById('root') as HTMLElement

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
)
