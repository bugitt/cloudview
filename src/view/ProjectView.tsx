import { RouteObject } from 'react-router-dom'
import { NavBar } from '../components/base/NavBar'
import { Projects } from '../components/project/Projects'
import { Project } from '../components/project/Project'

const projectNavKey = 'project'

export const projectRoutes: RouteObject[] = [
    {
        path: '/project/:projectId/',
        element: (
            <NavBar navKey={projectNavKey}>
                <Project />
            </NavBar>
        )
    },
    {
        path: '/projects',
        element: (
            <NavBar navKey={projectNavKey}>
                <Projects />
            </NavBar>
        )
    }
]
