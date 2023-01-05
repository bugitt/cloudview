import { NextApiRequest } from "next";
import { serverSideCloudapiClient } from "./cloudapi";
import { getTokenFromReq } from "./token";

export const whoami =async (req:NextApiRequest) => {
    const token = getTokenFromReq(req)
    const client = serverSideCloudapiClient(token)
    return (await client.getWhoami(true)).data
}