import { WorkflowTemplate } from "../../models/workflow";


export const workflowTemplates: WorkflowTemplate[] = [
    {
        key: 'simpleNginx',
        name: '静态网站（Nginx）',
        baseImage: '10.251.0.39:5432/library/nginx:latest',
        resource: {
            cpu: 50,
            memory: 100,
        },
        buildSpec: {
            command: "cp -r . /usr/share/nginx/html/"
        },
        deploySpec: {
            changeEnv: false,
            command: `nginx -g 'daemon off;'`,
            ports: [{ port: 80, protocol: 'tcp' }],
        },
        needCompile: true,
        fileUploadInfo: '请上传要部署的静态网站文件压缩包，请保证 index.html 位于压缩包的根目录中。',
    }
]