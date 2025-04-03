import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";

interface WMKSPageProps {
  host: string;
  ticket: string;
}

// 新增类型定义
export interface WMKSPageRef {
  sendCtrlAltDel: () => void;
  sendText: (text: string) => void;
}

const WMKSPage = forwardRef<WMKSPageRef, WMKSPageProps>(({ host, ticket }, ref) => {
  const wmksContainerRef = useRef<HTMLDivElement | null>(null);
  const wmksInstance = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    sendCtrlAltDel: () => {
      if (!wmksInstance.current) return;
      wmksInstance.current.sendCAD();
    },
    sendText: (text: string) => {
      if (!wmksInstance.current) return;
      wmksInstance.current.sendInputString(text);
    }
  }));

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/view/v2/wmks.min.js";
    script.async = true;
    script.onload = () => {
      console.log("WMKS SDK loaded");
      connect();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (wmksInstance.current) {
        wmksInstance.current.destroy();
      }
    };
  }, []);

  const connect = () => {
    if (!(window as any).WMKS) {
      console.error("WMKS SDK not loaded");
      return;
    }
    const options = {
      rescale: true,
      changeResolution: true,
      position: (window as any).WMKS.CONST.Position.CENTER,
    };
    wmksInstance.current = (window as any).WMKS.createWMKS("wmksContainer", options);
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (canvas) {
      canvas.style.position = "relative";
    }
    const url = `wss://scs.buaa.edu.cn/esxi/${host}/${ticket}`;
    try {
      wmksInstance.current.connect(url);
      console.log("Connected to VM Console");
    } catch (err) {
      console.error("Connection failed: ", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        id="wmksContainer"
        ref={wmksContainerRef}
        className="border-2 border-blue-500 w-full h-[60vh]"
      ></div>
    </div>
  );
});

export default WMKSPage;
