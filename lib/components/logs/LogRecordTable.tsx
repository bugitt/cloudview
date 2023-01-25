import { ColumnsState, ProColumns, ProTable } from "@ant-design/pro-components";
import moment from "moment";
import { useState } from "react";
import { LogRecord, LogRecordSearchRequest } from "../../cloudapi-client";
import { cloudapiClient } from "../../utils/cloudapi";

interface LogRecordTableType extends LogRecord {
    key: React.Key
    index: number
}

export function LogRecordTable() {
    const [columnsStateMap, setColumnsStateMap] = useState<{
        [key: string]: ColumnsState;
    }>({
        requestHeaders: {
            show: false,
        },
        responseHeaders: {
            show: false,
        },
        httpVersion: {
            show: false,
        },
        userAgent: {
            show: false,
        },
        errMsg: {
            show: false,
        }
    });
    const columns: ProColumns<LogRecordTableType>[] = [
        {
            title: '序号',
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            search: false,
        },
        {
            title: '学工号',
            dataIndex: 'userId',
            valueType: 'text',
        },
        {
            title: '姓名',
            dataIndex: 'username',
            valueType: 'text',
        },
        {
            title: 'HTTP方法',
            dataIndex: 'method',
            valueType: 'text',
        },
        {
            title: '请求路径',
            dataIndex: 'path',
            valueType: 'text',
        },
        {
            title: '请求头信息',
            dataIndex: 'requestHeaders',
            valueType: 'code',
            search: false,

        },
        {
            title: 'HTTP版本',
            dataIndex: 'httpVersion',
            valueType: 'text',
            search: false,
        },
        {
            title: '源IP',
            dataIndex: 'realIp',
            valueType: 'text',
            search: false,
        },
        {
            title: 'User Agent',
            dataIndex: 'userAgent',
            valueType: 'text',
            search: false,
        },
        {
            title: 'HTTP状态码',
            dataIndex: 'responseStatus',
            valueType: 'text',
        },
        {
            title: '错误信息',
            dataIndex: 'errMsg',
            valueType: 'text',
        },
        {
            title: '响应头信息',
            dataIndex: 'responseHeaders',
            valueType: 'code',
            search: false,
        },
        {
            title: '调用时间',
            dataIndex: 'startAt',
            valueType: 'dateTime',
            hideInSearch: true,
        },
        {
            title: '耗时（ms）',
            dataIndex: 'duration',
            valueType: 'text',
            search: false,
        },
        {
            title: '调用时间',
            dataIndex: 'startAt',
            valueType: 'dateRange',
            hideInTable: true,
            search: {
                transform: (value) => {
                    return {
                        timeRange: `${moment(value[0]).unix() * 1000}-${moment(value[1]).unix() * 1000}`,
                    };
                },
            },
        },
    ]
    return (
        <>
            <ProTable<LogRecordTableType>
                columns={columns}
                request={async (params, sort, filter) => {
                    const req: LogRecordSearchRequest = {
                        pagination: {
                            current: params.current!!,
                            pageSize: params.pageSize!!,
                        },
                        userId: params.userId,
                        username: params.username,
                        method: params.method,
                        path: params.path,
                        status: params.responseStatus,
                        errMsg: params.errMsg,
                        timeRange: params.timeRange,
                    }
                    const resp = (await cloudapiClient.postLogs(req)).data
                    return {
                        data: resp.data.map((v, i) => {
                            return {
                                ...v,
                                key: i,
                                index: i,
                            }
                        }),
                        success: true,
                        total: resp.total,
                        page: resp.page,
                    }
                }}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                pagination={{
                    pageSize: 10,
                }}
                columnsState={{
                    value: columnsStateMap,
                    onChange: (map) => setColumnsStateMap(map),
                }}
                dateFormatter="string"
                headerTitle="日志记录"
            />
        </>
    )
}