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
        endpoint: string;
        ref?: string;
        scheme?: "http" | "https";
        userPassword?: string;
        username?: string;
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
