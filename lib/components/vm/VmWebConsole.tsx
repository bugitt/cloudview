import { useEffect, useRef } from "react";

interface WMKSPageProps {
  host: string;
  ticket: string;
}

const WMKSPage: React.FC<WMKSPageProps> = ({ host, ticket }) => {
  const wmksContainerRef = useRef<HTMLDivElement | null>(null);
  const wmksInstance = useRef<any>(null);

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
    if (!window.WMKS) {
      console.error("WMKS SDK not loaded");
      return;
    }
    const options = {
      rescale: true,
      changeResolution: true,
      position: window.WMKS.CONST.Position.CENTER,
    };
    wmksInstance.current = window.WMKS.createWMKS("wmksContainer", options);
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    if (canvas) {
      canvas.style.position = "relative";
    }
    const url = `ws://10.251.253.111/${host}/${ticket}`;
    try {
      wmksInstance.current.connect(url);
      console.log("Connected to VM Console");
    } catch (err) {
      console.error("Connection failed: ", err);
    }
  };

  const sendCtrlAltDel = () => {
    if (!wmksInstance.current) return;
    wmksInstance.current.sendCAD();
    console.log("Sent Ctrl+Alt+Del");
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={sendCtrlAltDel}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        发送 Ctrl+Alt+Del
      </button>
      <div
        id="wmksContainer"
        ref={wmksContainerRef}
        className="border-2 border-blue-500 w-full h-[60vh]"
      ></div>
    </div>
  );
};

export default WMKSPage;
