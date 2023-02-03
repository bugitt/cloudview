import { NextApiRequest } from "next";
import { CloudapiClientType, serverSideCloudapiClient } from "./cloudapi";
import { getTokenFromReq } from "./token";

export const whoami = async (req: NextApiRequest, srcClient?: CloudapiClientType) => {
    let client = srcClient
    if (!client) {
        const token = getTokenFromReq(req)
        client = serverSideCloudapiClient(token)
    }
    return (await client.getWhoami(true)).data
}