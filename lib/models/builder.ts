/* tslint:disable */
import * as k8s from '@kubernetes/client-node';
import { BaseCRDHistory, BaseCRDStatus, crdDisplayStatus } from './crd';

export const crdBuilderKind = "Builder";

/**
 * Builder is the Schema for the builders API
 */
export interface Builder extends k8s.KubernetesObject {
  /**
   * BuilderSpec defines the desired state of Builder
   */
  spec: BuilderSpec
  /**
   * BuilderStatus defines the observed state of Builder
   */
  status?: BaseCRDStatus
}

export interface BuilderSpec {
  context: {
    git?: {
      urlWithAuth: string;
      ref?: string;
    };
    raw?: string;
    s3?: {
      accessKeyID: string;
      accessSecretKey: string;
      bucket: string;
      endpoint?: string;
      fileType?: "tar" | "tar.gz" | "zip" | "rar" | "dir";
      objectKey: string;
      region: string;
      scheme?: "http" | "https";
    };
  };
  destination: string;
  dockerfilePath?: string;
  pushSecretName?: string;
  round?: number;
  workspacePath?: string;
  deployerHooks?: DeployerHook[];
}

export interface BuilderList extends k8s.KubernetesListObject<Builder> { }

export interface ImageMeta {
  owner: string;
  name: string;
  tag: string;
}

export interface CreateImageBuilderRequest {
  projectName: string
  imageMeta: {
    name: string
    tag: string
  }
  context: {
    git?: {
      urlWithAuth: string
      ref?: string
    }
    s3?: {
      objectKey: string
    }
    raw?: string
  }
  dockerfilePath?: string
  workspacePath?: string
}

export interface DeployerHook {
  deployerName: string
  image?: string
  dynamicImage?: boolean
  resourcePool: string
}

export function getImageMeta(builder: Builder): ImageMeta {
  const labels = builder.metadata?.labels ?? {};
  return {
    owner: labels["image.owner"],
    name: labels["image.name"],
    tag: labels["image.tag"],
  }
}

export function getImageUri(imageMeta: ImageMeta) {
  return `scs.buaa.edu.cn:8081/${imageMeta.owner}/${imageMeta.name}:${imageMeta.tag}`
}

export function getImageMetaFromUri(uri: string): ImageMeta {
  const [owner, nameWithTag] = uri.split("/").slice(1);
  const [name, tag] = nameWithTag.split(":");
  return {
    owner,
    name,
    tag,
  }
}

export function getBuilderImageUri(builder: Builder) {
  const imageMeta = getImageMeta(builder);
  return `scs.buaa.edu.cn:8081/${imageMeta.owner}/${imageMeta.name}:${imageMeta.tag}`
}

export function builderDisplayName(builder: Builder) {
  const imageMeta = getImageMeta(builder);
  const tag = imageMeta?.tag ? `:${imageMeta.tag}` : "";
  return `${imageMeta.name}${tag}`
}

const convertStatus = (status: string) => {
  switch (status.toLocaleLowerCase()) {
    case "undo":
      return '未调度';
    case "pending":
      return "排队中";
    case "doing":
      return "进行中";
    case "done":
      return "成功完成";
    case "failed":
      return "任务失败";
    default:
      return "未知状态";
  }
}

export function builderDisplayStatus(builder: Builder): crdDisplayStatus {
  return convertStatus(builder.status?.base?.status ?? "undo");
}

export function builderHistoryList(builder: Builder): BaseCRDHistory<BuilderSpec>[] {
  return (builder.status?.base?.historyList ?? ([] as string[])).map(str => {
    const obj = JSON.parse(str)
    obj.status = convertStatus(obj.status ?? obj.Status ?? 'undo')
    return obj as BaseCRDHistory<BuilderSpec>
  }).sort((a, b) => b.round - a.round)
}
