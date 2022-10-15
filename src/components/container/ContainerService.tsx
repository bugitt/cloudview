import { Card } from "antd";
import { ContainerServiceListTable } from "./ContainerServiceListTable";
import containerSvg from "../../assets/container.svg";

export const ContainerService = () => {
    return (
        <>
            <Card
                title={
                    <>
                        <h3>
                            <img src={containerSvg} width={40} alt="" />
                            &nbsp;容器服务
                        </h3>
                    </>
                }
            >
                <ContainerServiceListTable />
            </Card>
        </>
    );
};
