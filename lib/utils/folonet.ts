import axios from 'axios';
import { folonetConfig } from '../config/env';
import { ServicePort } from '../models/deployer';

interface FolonetRegistryRequest {
    name: string;
    deployment: string;
    service: string;
    namespace: string;
    ports: string;
}

interface FolonetRegistryResponse {
    Name: string;
    Deployment: string;
    Service: string;
    Namespace: string;
    IP: string;
    LocalEndpoints: string;
}

interface FolonetUnregistryResponse {
}

export async function folonetRegistry(params: FolonetRegistryRequest): Promise<FolonetRegistryResponse> {
    const url = folonetConfig.serverBaseURL + "/registry"

    try {
        const response = await axios.get<FolonetRegistryResponse>(url, { params });
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}

export async function folonetUnregistry(name: string): Promise<FolonetUnregistryResponse> {
    const url = folonetConfig.serverBaseURL + "/unregistry" + "?name=" + name

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}

export async function folonetPorts(name: string): Promise<ServicePort[]> {
    const url = folonetConfig.serverBaseURL + "/servicePorts" + "?name=" + name

    try {
        const response = await axios.get<ServicePort[]>(url);
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}
