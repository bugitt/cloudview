import { Repository } from "../cloudapi-client";

export function repoUrl(repo: Repository): string {
    return `https://${repo.username}:${repo.token}@scs.buaa.edu.cn/git/${repo.name}.git`
}