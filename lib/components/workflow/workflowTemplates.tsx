import { ProFormInstance, ProFormText } from "@ant-design/pro-components";
import { MutableRefObject } from "react";
import { ExperimentWorkflowConfiguration, WorkflowTemplate } from "../../models/workflow";

export const workflowTemplates: WorkflowTemplate[] = [
    {
        key: 'simpleNginx',
        name: '静态网站（Nginx）',
        baseImage: 'scs.buaa.edu.cn:8081/library/nginx:latest',
        resource: {
            cpu: 10,
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
    },
    {
        key: 'simpleMysql',
        name: 'MySQL 8',
        baseImage: 'scs.buaa.edu.cn:8081/library/mysql8:1.0.0',
        resource: {
            cpu: 100,
            memory: 512,
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
    },
]