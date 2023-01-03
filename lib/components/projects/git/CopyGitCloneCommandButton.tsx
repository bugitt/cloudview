import { Button } from "antd";
import { Repository } from "../../../cloudapi-client";
import { copyToClipboard } from "../../../utils/clipboard";

export function CopyGitCloneCommandButton({ repo }: { repo: Repository }) {
    const command = `git clone https://${repo.username}:${repo.token}@scs.buaa.edu.cn/git/${repo.name}.git`
    return (
        <Button onClick={() => {
            copyToClipboard(command, '克隆命令')
        }}>
            复制克隆命令
        </Button>
    )
}