import {Configuration, DefaultApiFactory} from "../cloudapi-client";
import {getToken} from "./token";
import globalAxios from "axios";
import {message} from "antd";

const cloudapiAxios = globalAxios

cloudapiAxios.interceptors.response.use((response) => response, (error) => {
    const statusCode = error.response?.status;
    if (statusCode === 401 || statusCode === 403) {
        message.error("登录已过期，请重新登录").then(r => r, e => {
            throw e
        });
    }
    throw error
});

export const cloudapiClient =
    DefaultApiFactory(new Configuration({
        apiKey: (name: string) => {
            if (name === "Authorization") {
                return getToken();
            }
            return "";
        }
    }), undefined, cloudapiAxios);
