import { LoadingOutlined } from "@ant-design/icons"
import useWebSocket from 'react-use-websocket';
import { Button } from "antd"
import { useEffect, useState } from "react"
import { getToken } from "../../utils/token";
import TextArea from "antd/es/input/TextArea";

interface Props {
    namespace: string
    pod: string
    container?: string
}

export function PodLogTerminal(props: Props) {
    const { namespace, pod, container } = props
    const socketUrl = () => {
        const params = new URLSearchParams()
        params.append('namespace', namespace)
        params.append('podName', pod)
        if (container) {
            params.append('containerName', container)
        }
        return `ws://localhost:9999/api/v2/ws/kubeLog/${getToken()}?${params.toString()}`
    }
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [content, setContent] = useState<string>('')
    const { lastMessage, readyState } = useWebSocket(
        socketUrl(),
        {
            share: true,
            shouldReconnect: () => false,
        }
    );

    useEffect(() => {
        lastMessage && setContent((pre) => pre + '\n' + lastMessage.data)
    }, [lastMessage]);

    const readyStateString = {
        '-1': 'UNINSTANTIATED',
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING',
        3: 'CLOSED',
    }[readyState];

    return (<>
        {readyState === 1 ?
            <TextArea value={content} style={{
                height: 500,
            }} />
            : <LoadingOutlined />
        }
    </>)
}