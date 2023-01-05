// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { k8sCoreV1Api, k8sCustomObjectsApi } from '../../lib/kube/client'
import { imageBuilderClient } from '../../lib/kube/cloudrun'

type Data = {
  name?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const builder = await imageBuilderClient.get("builder-sample", "default")
  res.status(200).json({ name: builder.status?.base?.historyList?.at(0)})
}
