import { ProFormInstance, ProFormText } from "@ant-design/pro-components";
import { Typography } from "antd";
import { MutableRefObject } from "react";
import { ServicePort } from "../../models/deployer";
import { ExperimentWorkflowConfiguration, Workflow, WorkflowTemplate } from "../../models/workflow";


export const workflowTemplates: WorkflowTemplate[] = [
    {
        key: 'simpleNginx',
        name: '静态网站（Nginx）',
        baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
        resource: {
            cpu: 20,
            memory: 20,
        },
        buildSpec: {
            command: "cp -r . /usr/share/nginx/html/"
        },
        deploySpec: {
            changeEnv: false,
            command: `nginx -g 'daemon off;'`,
            ports: [{ port: 80, protocol: 'tcp' }],
        },
    },
    {
        key: 'simpleMysql',
        name: 'MySQL 8',
        baseImage: 'scs.buaa.edu.cn:8081/library/mysql8:1.0.0',
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
        decorate: function (wfConfig: ExperimentWorkflowConfiguration, values: any) {
            const mysqlRootPassword = values.mysqlRootPassword as string
            let env: { [k: string]: string } = wfConfig.deploySpec.env ?? {}
            env['MYSQL_ROOT_PASSWORD'] = mysqlRootPassword
            wfConfig.deploySpec.env = env
            return wfConfig
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
]