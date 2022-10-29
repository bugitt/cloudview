import { PieChartOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Breadcrumb, Layout, Menu } from 'antd'
import React, { useState } from 'react'
import logoPng from '../../assets/school_logo_white.367c151.png'
import { ScsFooter } from './ScsFooter'

const { Header, Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[]
): MenuItem {
    return {
        key,
        icon,
        children,
        label
    } as MenuItem
}

const items: MenuItem[] = [
    getItem('项目管理', 'project', <PieChartOutlined />),
    getItem('课程管理', 'course', <PieChartOutlined />)
]

interface NavBarProps {
    navKey: string
    children: React.ReactNode
}

const deepBackgroundColor = '#55A5E8'

export const NavBar: React.FC<NavBarProps> = ({
    navKey,
    children
}: NavBarProps) => {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={value => setCollapsed(value)}
                theme="light"
                style={{ background: deepBackgroundColor }}
            >
                <img
                    src={logoPng}
                    alt=""
                    style={{
                        width: '80%',
                        marginTop: '25px',
                        marginBottom: '25px',
                        marginLeft: '10%'
                    }}
                ></img>
                <Menu
                    theme="light"
                    defaultSelectedKeys={[navKey]}
                    mode="inline"
                    items={items}
                    onClick={item => console.log(item)}
                    style={{ background: deepBackgroundColor, color: 'white' }}
                />
            </Sider>
            <Layout className="site-layout">
                <Header
                    className="site-layout-background"
                    style={{ padding: 0 }}
                >
                    <h1 style={{ marginLeft: '16px' }}>云平台</h1>
                </Header>
                <Content style={{ margin: '0 16px' }}>
                    <Breadcrumb style={{ margin: '16px 0' }}>
                        <Breadcrumb.Item>User</Breadcrumb.Item>
                        <Breadcrumb.Item>Bill</Breadcrumb.Item>
                    </Breadcrumb>
                    {children}
                </Content>
                <ScsFooter />
            </Layout>
        </Layout>
    )
}
