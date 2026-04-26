import { ProFormInstance, ProFormText } from "@ant-design/pro-components";
import { Typography } from "antd";
import { MutableRefObject } from "react";
import { ServicePort } from "../../models/deployer";
import { CreateWorkflowRequest, ExperimentWorkflowConfiguration, Workflow, WorkflowTemplate } from "../../models/workflow";


export const workflowTemplates: WorkflowTemplate[] = [
    {
        key: 'simpleNginx',
        name: '静态网站（Nginx）',
        baseImage: '10.251.0.36:5432/library/nginx:latest',
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
        key: 'simpleMysql',
        name: 'MySQL',
        baseImage: '10.251.0.36:5432/library/mysql:latest',
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
        key: 'simplePostgres',
        name: 'PostgreSQL',
        baseImage: '10.251.0.36:5432/library/postgres:latest',
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
        key: 'simpleRedis',
        name: 'Redis',
        baseImage: '10.251.0.36:5432/library/redis:latest',
        resource: {
            cpu: 100,
            memory: 128,
        },
        deploySpec: {
            changeEnv: false,
            ports: [{ port: 6379, protocol: 'tcp' }],
            command: 'sh -c \'redis-server --requirepass "$REDIS_PASSWORD"\'',
        },
        extraFormItems: (
            <>
                <ProFormText
                    name="redisPassword"
                    label="Redis 密码"
                    required
                />
            </>
        ),
        decorateConfiguration: function (wfConfig: ExperimentWorkflowConfiguration, values: any) {
            const redisPassword = values.redisPassword as string
            let env: { [k: string]: string } = wfConfig.deploySpec.env ?? {}
            env['REDIS_PASSWORD'] = redisPassword
            wfConfig.deploySpec.env = env
            return wfConfig
        },
        decorateCreateWorkflowRequest: function (req: CreateWorkflowRequest, values: any) {
            const redisPassword = values.redisPassword as string
            let env: { [k: string]: string } = req.env ?? {}
            env['REDIS_PASSWORD'] = redisPassword
            req.env = env
            return req
        },
        setFormFields: function (wfConfig: ExperimentWorkflowConfiguration, formRef?: MutableRefObject<ProFormInstance<any> | undefined>) {
            formRef?.current?.setFieldsValue({
                redisPassword: wfConfig.deploySpec.env?.['REDIS_PASSWORD'] ?? '',
            })
        },
        getServiceStatusListItemByPort: function (port: ServicePort, wf: Workflow) {
            switch (port.port) {
                case 6379:
                    return {
                        disableAutoConnect: true,
                        title: 'Redis端口',
                        description: <>
                            <Typography>
                                Redis IP <Typography.Text code>
                                    {port.ip}
                                </Typography.Text>，
                                端口 <Typography.Text code>
                                    {port.nodePort}
                                </Typography.Text>，
                                密码 <Typography.Text code>
                                    {wf.spec.deploy.env?.['REDIS_PASSWORD']}
                                </Typography.Text>
                            </Typography>
                        </>,
                    }
                default:
                    return undefined
            }
        }
    },
]