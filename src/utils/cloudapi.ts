import {Configuration, DefaultApiFactory} from "../cloudapi-client";
import {getToken} from "./token";

export const cloudapiClient =
    DefaultApiFactory(new Configuration({
        apiKey: (name: string) => {
            if (name === "Authorization") {
                return getToken();
            }
            return "";
        }
    }))
