import { HttpStatusCode } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { serverSideCloudapiClient } from "../../../lib/utils/cloudapi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success: number,
    failed: number
  } | string >
) {
  if (req.method !== 'POST') {
    res.status(HttpStatusCode.MethodNotAllowed)
      .json('Method not allowed')
    return
  }

  const client = serverSideCloudapiClient(
    undefined,
    req
  )
  
  const response = await client.ensurePersonalProjects()
  if (response.status != HttpStatusCode.Ok) {
    res.status(response.status)
      .json(`Failed in request. Status code: ${response.status}, message: ${response.data}`)
    return
  }

  res.status(HttpStatusCode.Ok)
    .json(response.data)
}