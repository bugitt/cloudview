/* tslint:disable */
import * as k8s from '@kubernetes/client-node';
import { BaseCRDStatus } from './crd';

export const crdBuilderKind = "Builder";

/**
 * Builder is the Schema for the builders API
 */
export interface Builder extends k8s.KubernetesObject {
  /**
   * BuilderSpec defines the desired state of Builder
   */
  spec: {
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
  };
  /**
   * BuilderStatus defines the observed state of Builder
   */
  status?: BaseCRDStatus
}

export interface BuilderList extends k8s.KubernetesListObject<Builder> { }

export function getImageMeta(builder: Builder) {
  const labels = builder.metadata?.labels ?? {};
  return {
    owner: labels["image.owner"],
    name: labels["image.name"],
    tag: labels["image.tag"],
  }
}

export function builderDisplayName(builder: Builder) {
  const imageMeta = getImageMeta(builder);
  const tag = imageMeta?.tag ? `:${imageMeta.tag}` : "";
  return `${imageMeta.name}${tag}`
}
