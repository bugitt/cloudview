import { Button, Drawer } from "antd";
import { useState } from "react";
import { Repository } from "../../../cloudapi-client";
import { CopyGitCloneCommandButton } from "./CopyGitCloneCommandButton";

interface ShowGitRepoDrawerProps {
    repo: Repository,
}

export function ShowGitRepoDrawer(props: ShowGitRepoDrawerProps) {
    const [open, setOpen] = useState(false);

    const { repo } = props

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
                    {`代码仓库 - ${repo.repoName}`}
                    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                    <CopyGitCloneCommandButton repo={repo} />
                </>
            )}
                placement="right"
                onClose={onClose}
                open={open}
                width="80%"
            >
                <iframe
                    src={repo.url}
                    style={{
                        height: '100%',
                        width: '100%',
                        border: 'none',
                    }}
                />
            </Drawer>
        </>
    );
}