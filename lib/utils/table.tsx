import { ReactKeyType } from './type'
import React, { useRef, useState } from 'react'
import { ProColumns } from '@ant-design/pro-components'
import { Button, Input, InputRef, Space } from 'antd'
import { FilterConfirmProps } from 'antd/es/table/interface'
import { SearchOutlined } from '@ant-design/icons'
import Highlighter from 'react-highlight-words'

type KK = keyof ReactKeyType

export function GetColumnSearchProps<T extends ReactKeyType>(
    dataIndex: keyof T,
    compareFunc?: (record: T, searchKeyword: string) => boolean,
    renderFunc?: (dom: React.ReactNode, entity: T) => React.ReactNode
): ProColumns<T> {
    type DataIndex = keyof T

    const finalCompareFunc =
        compareFunc ??
        ((record: T, searchKeyword: string) =>
            (record[dataIndex] as string).includes(searchKeyword))

    const [searchText, setSearchText] = useState('')
    const [searchedColumn, setSearchedColumn] = useState<React.Key | symbol>('')
    const searchInput = useRef<InputRef>(null)

    const handleSearch = (
        selectedKeys: string[],
        confirm: (param?: FilterConfirmProps) => void,
        dataIndex: DataIndex
    ) => {
        confirm()
        setSearchText(selectedKeys[0])
        setSearchedColumn(dataIndex)
    }

    const handleReset = (clearFilters: () => void) => {
        clearFilters()
        setSearchText('')
    }
    return {
        filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters
        }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={searchInput}
                    value={selectedKeys[0]}
                    onChange={e =>
                        setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
                    onPressEnter={() =>
                        handleSearch(
                            selectedKeys as string[],
                            confirm,
                            dataIndex
                        )
                    }
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() =>
                            handleSearch(
                                selectedKeys as string[],
                                confirm,
                                dataIndex
                            )
                        }
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        搜索
                    </Button>
                    <Button
                        onClick={() =>
                            clearFilters && handleReset(clearFilters)
                        }
                        size="small"
                        style={{ width: 90 }}
                    >
                        重置
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined
                style={{ color: filtered ? '#1890ff' : 'black' }}
            />
        ),

        onFilter: (value, record) =>
            finalCompareFunc(record, (value as string).toLowerCase()),

        onFilterDropdownOpenChange: visible => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100)
            }
        },
        render: (dom, entity) =>
            renderFunc ? (
                renderFunc(dom, entity)
            ) : searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={dom ? dom.toString() : ''}
                />
            ) : (
                dom
            )
    }
}
