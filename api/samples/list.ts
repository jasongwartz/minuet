// api/samples/list.ts
import { list } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { blobs } = await list({ prefix: 'samples/' })

  const files = blobs.map((blob) => ({
    name: blob.pathname.replace(/^samples\//, ''),
    url: blob.url,
  }))

  res.setHeader('Content-Type', 'application/json')
  res.status(200).end(JSON.stringify(files))
}
