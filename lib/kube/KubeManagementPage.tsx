import { Select, SelectProps, Space } from "antd";
import { useState } from "react";
import { PodTable } from "./PodTable";
import { KubeNodeTable } from "./KubeNodeTable";

interface Props {
    allNamespaceList: string[]
}

const defaultNSList: string[] = []

export function KubeManagementPage(props: Props) {
    const [nsList, setNSListState] = useState<string[]>(defaultNSList)
    return (
        <>
            <Space style={{ width: '100%' }} direction="vertical" size='large'>
                <KubeNodeTable />
                <Space style={{ width: '100%' }}>
                    命名空间：
                    <Select
                        mode="multiple"
                        allowClear
                        style={{ width: '900px' }}
                        placeholder="请选择命名空间，默认展示所有命名空间"
                        defaultValue={defaultNSList}
                        onChange={(value) => {
                            setNSListState(value as string[])
                        }}
                        options={props.allNamespaceList.map((ns) => {
                            return {
                                label: ns,
                                value: ns,
                            }
                        })}
                    />
                </Space>

                <PodTable namespaceList={nsList} />
            </Space>
        </>
    )
}