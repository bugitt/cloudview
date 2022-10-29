import { createBrowserRouter, RouteObject } from 'react-router-dom'
import { projectRoutes } from './ProjectView'
import { App } from './App'

const routeList: RouteObject[] = []
routeList.push({
    path: '/',
    element: <App />
})
routeList.push(...projectRoutes)

export const router = createBrowserRouter(routeList, {
    basename: '/view/v2'
})
