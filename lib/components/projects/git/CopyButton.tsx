import { Button } from "antd";
import { Repository } from "../../../cloudapi-client";
import { copyToClipboard } from "../../../utils/clipboard";
import { repoUrl } from "../../../utils/repo";

export function CopyGitCloneCommandButton({ repo }: { repo: Repository }) {
    const command = `git clone ${repoUrl(repo)}`
    return (
        <Button onClick={() => {
            copyToClipboard(command, '克隆命令')
        }}>
            复制克隆命令
        </Button>
    )
}

export function CopyGitRepoUrlButton({ repo }: { repo: Repository }) {
    const text = repoUrl(repo)
    return (
        <Button onClick={() => {
            copyToClipboard(text, '仓库地址')
        }}>
            复制仓库地址
        </Button>
    )
}