import { ProFormInstance, ProFormText } from "@ant-design/pro-components";
import { Typography } from "antd";
import { MutableRefObject } from "react";
import { ServicePort } from "../../models/deployer";
import { CreateWorkflowRequest, ExperimentWorkflowConfiguration, Workflow, WorkflowTemplate } from "../../models/workflow";


export const workflowTemplates: WorkflowTemplate[] = [
    {
        key: 'simpleNginx',
        name: '静态网站（Nginx）',
        baseImage: 'harbor.service.internal:8081/library/nginx:latest',
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
    },
    {
        key: 'simplePython3.11',
        name: 'Python 3.11',
        baseImage: 'harbor.service.internal:8081/library/python3.11:1.0.0',
        resource: {
            cpu: 50,
            memory: 100,
        },
        buildSpec: {
            command: "pip install -r requirements.txt"
        },
        deploySpec: {
            changeEnv: false,
            command: ``,
            ports: [],
        },
        needCompile: true,
        fileUploadInfo: '请上传要部署的Python项目压缩包',
    },
    {
        key: 'simpleNode18',
        name: 'Node.js 18 with npm pnpm cnpm yarn',
        baseImage: 'harbor.service.internal:8081/library/node18-npm-cnpm-pnpm-yarn:1.1.0',
        resource: {
            cpu: 100,
            memory: 200,
        },
        buildSpec: {
            command: "npm install && npm run build"
        },
        deploySpec: {
            changeEnv: false,
            command: `npm run start`,
            ports: [{ port: 3000, protocol: 'tcp' }],
        },
        needCompile: true,
        fileUploadInfo: '上传要编译和部署的代码压缩包。请保证 package.json 文件位于压缩包的根目录。请注意不要包含 node_modules 文件夹。',
    },
    {
        key: 'simpleMysql',
        name: 'MySQL 8',
        baseImage: 'harbor.service.internal:8081/library/mysql8:1.0.0',
        resource: {
            cpu: 150,
            memory: 768,
        },
        deploySpec: {
            changeEnv: false,
            ports: [{ port: 3306, protocol: 'tcp' }],
        },
        extraFormItems: (
            <>
                <ProFormText
                    name="mysqlRootPassword"
                    label="数据库中 root 用户的密码"
                    required
                />
            </>
        ),
        decorateConfiguration: function (wfConfig: ExperimentWorkflowConfiguration, values: any) {
            const mysqlRootPassword = values.mysqlRootPassword as string
            let env: { [k: string]: string } = wfConfig.deploySpec.env ?? {}
            env['MYSQL_ROOT_PASSWORD'] = mysqlRootPassword
            wfConfig.deploySpec.env = env
            return wfConfig
        },
        decorateCreateWorkflowRequest: function (req: CreateWorkflowRequest, values: any) {
            const mysqlRootPassword = values.mysqlRootPassword as string
            let env: { [k: string]: string } = req.env ?? {}
            env['MYSQL_ROOT_PASSWORD'] = mysqlRootPassword
            req.env = env
            return req
        },
        setFormFields: function (wfConfig: ExperimentWorkflowConfiguration, formRef?: MutableRefObject<ProFormInstance<any> | undefined>) {
            formRef?.current?.setFieldsValue({
                mysqlRootPassword: wfConfig.deploySpec.env?.['MYSQL_ROOT_PASSWORD'] ?? '',
            })
        },
        getServiceStatusListItemByPort: function (port: ServicePort, wf: Workflow) {
            switch (port.port) {
                case 3306:
                    return {
                        disableAutoConnect: true,
                        title: 'MySQL数据库端口',
                        description: <>
                            <Typography>
                                数据库 IP <Typography.Text code>
                                    {port.ip}
                                </Typography.Text>，
                                端口 <Typography.Text code>
                                    {port.nodePort}
                                </Typography.Text>，
                                用户名 <Typography.Text code>
                                    root
                                </Typography.Text>，
                                密码 <Typography.Text code>
                                    {wf.spec.deploy.env?.['MYSQL_ROOT_PASSWORD']}
                                </Typography.Text>
                            </Typography>
                        </>,
                    }
                default:
                    return undefined
            }
        }
    },
    {
        key: 'simpleCodeServer',
        name: 'Code Server',
        baseImage: 'scs.buaa.edu.cn:8081/library/code-server:v0.1.0',
        resource: {
            cpu: 1000,
            memory: 2048,
        },
        deploySpec: {
            changeEnv: false,
            ports: [{ port: 8443, protocol: 'tcp' }],
        },
        extraFormItems: (
            <>
                <ProFormText
                    name="password"
                    label="Code Server的登录密码"
                    required
                />
            </>
        ),
        decorateConfiguration: function (wfConfig: ExperimentWorkflowConfiguration, values: any) {
            const password = values.password as string
            let env: { [k: string]: string } = wfConfig.deploySpec.env ?? {}
            env['PASSWORD'] = password
            wfConfig.deploySpec.env = env
            return wfConfig
        },
        decorateCreateWorkflowRequest: function (req: CreateWorkflowRequest, values: any) {
            const password = values.password as string
            let env: { [k: string]: string } = req.env ?? {}
            env['PASSWORD'] = password
            req.env = env
            return req
        },
        setFormFields: function (wfConfig: ExperimentWorkflowConfiguration, formRef?: MutableRefObject<ProFormInstance<any> | undefined>) {
            formRef?.current?.setFieldsValue({
                password: wfConfig.deploySpec.env?.['PASSWORD'] ?? '',
            })
        },
        getServiceStatusListItemByPort: function (port: ServicePort, wf: Workflow) {
            switch (port.port) {
                case 3306:
                    return {
                        disableAutoConnect: true,
                        title: 'Code Server 访问入口',
                        description: <>
                            <Typography>
                                数据库 IP <Typography.Text code>
                                    {port.ip}
                                </Typography.Text>，
                                端口 <Typography.Text code>
                                    {port.nodePort}
                                </Typography.Text>，
                                密码 <Typography.Text code>
                                    {wf.spec.deploy.env?.['PASSWORD']}
                                </Typography.Text>
                            </Typography>
                        </>,
                    }
                default:
                    return undefined
            }
        }
    },
    {
        key: 'simplePostgres',
        name: 'PostgreSQL 15',
        baseImage: 'harbor.service.internal:8081/library/postgres:15',
        resource: {
            cpu: 100,
            memory: 128,
        },
        deploySpec: {
            changeEnv: false,
            ports: [{ port: 5432, protocol: 'tcp' }],
        },
        extraFormItems: (
            <>
                <ProFormText
                    name="postgresPassword"
                    label="数据库中 postgres 用户的密码"
                    required
                />
            </>
        ),
        decorateConfiguration: function (wfConfig: ExperimentWorkflowConfiguration, values: any) {
            const postgresPassword = values.postgresPassword as string
            let env: { [k: string]: string } = wfConfig.deploySpec.env ?? {}
            env['POSTGRES_PASSWORD'] = postgresPassword
            wfConfig.deploySpec.env = env
            return wfConfig
        },
        decorateCreateWorkflowRequest: function (req: CreateWorkflowRequest, values: any) {
            const postgresPassword = values.postgresPassword as string
            let env: { [k: string]: string } = req.env ?? {}
            env['POSTGRES_PASSWORD'] = postgresPassword
            req.env = env
            return req
        },
        setFormFields: function (wfConfig: ExperimentWorkflowConfiguration, formRef?: MutableRefObject<ProFormInstance<any> | undefined>) {
            formRef?.current?.setFieldsValue({
                postgresPassword: wfConfig.deploySpec.env?.['POSTGRES_PASSWORD'] ?? '',
            })
        },
        getServiceStatusListItemByPort: function (port: ServicePort, wf: Workflow) {
            switch (port.port) {
                case 5432:
                    return {
                        disableAutoConnect: true,
                        title: 'Postgres数据库端口',
                        description: <>
                            <Typography>
                                数据库 IP <Typography.Text code>
                                    {port.ip}
                                </Typography.Text>，
                                端口 <Typography.Text code>
                                    {port.nodePort}
                                </Typography.Text>，
                                用户名 <Typography.Text code>
                                    postgres
                                </Typography.Text>，
                                密码 <Typography.Text code>
                                    {wf.spec.deploy.env?.['POSTGRES_PASSWORD']}
                                </Typography.Text>
                                默认数据库名 <Typography.Text code>
                                    postgres
                                </Typography.Text>
                            </Typography>
                        </>,
                    }
                default:
                    return undefined
            }
        }
    },
    {
        key: 'ubuntu2204',
        name: 'Ubuntu 22.04',
        baseImage: 'harbor.service.internal:8081/library/ubuntu-ttyd:22.04-v-1.0.6',
        resource: {
            cpu: 500,
            memory: 512,
        },
        deploySpec: {
            changeEnv: false,
            ports: [{ port: 7681, protocol: 'tcp' }],
        },
        getServiceStatusListItemByPort: function (port: ServicePort, wf: Workflow) {
            switch (port.port) {
                case 7681:
                    return {
                        title: '访问 Terminal',
                        description: <>
                            <Typography>
                                请使用 <Typography.Link href={`http://${port.ip}:${port.nodePort}`}>该链接</Typography.Link> 访问 Terminal。
                                请注意：该环境联网性能很差，仅供学习了解 Linux 环境使用。例如，你可以练习使用VIM，使用 GCC 编译代码和 GDB 调试代码，使用 Python 运行脚本等。
                            </Typography>
                        </>,
                    }
                default:
                    return undefined
            }
        }
    },
]