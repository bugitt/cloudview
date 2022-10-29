import { Layout } from 'antd'
import { Content } from 'antd/es/layout/layout'
import { ScsFooter } from '../components/base/ScsFooter'

export const Login = () => {
    return (
        <>
            <Layout style={{ height: '100vh' }}>
                <Content>
                    <h1>登录</h1>
                </Content>
                <ScsFooter />
            </Layout>
        </>
    )
}
