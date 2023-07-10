import { Select, SelectProps, Space } from "antd";
import { useState } from "react";
import { PodTable } from "./PodTable";

interface Props {
    namespaceList: string[]
}

const defaultNSList = ['default']

export function KubeManagementPage(props: Props) {
    const [nsList, setNSListState] = useState<string[]>(defaultNSList)
    return (
        <>
            <Space style={{ width: '100%' }} direction="vertical" size='large'>
                <Space style={{ width: '100%' }}>
                    命名空间：
                    <Select
                        mode="multiple"
                        allowClear
                        style={{ width: '900px' }}
                        placeholder="请选择"
                        defaultValue={defaultNSList}
                        onChange={(value) => {
                            setNSListState(value as string[])
                        }}
                        options={props.namespaceList.map((ns) => {
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