import { Button, Drawer } from "antd";
import { useState } from "react";
import { Builder, builderDisplayName } from "../../../models/builder"
import { CopyGitCloneCommandButton } from "../git/CopyButton";
import { FaDocker } from "react-icons/fa";

interface ShowBuilderDrawerProps {
    builder: Builder
}

export const ShowBuilderDrawer = (props: ShowBuilderDrawerProps) => {
    const [open, setOpen] = useState(false);

    const { builder } = props

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Button type="primary" onClick={showDrawer}>
                查看
            </Button>
            <Drawer title={(
                <>
                    <FaDocker />
                    &nbsp;&nbsp;
                    {`镜像构建任务 - ${builderDisplayName(builder)}`}
                </>
            )}
                placement="right"
                onClose={onClose}
                width="50%"
                open={open}
            >

            </Drawer>
        </>
    );
}