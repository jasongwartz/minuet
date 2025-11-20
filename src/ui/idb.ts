import Dexie, { type EntityTable } from 'dexie'

interface SampleData {
  name: string
  url: string
  arrayBuffer: ArrayBuffer
  mimeType: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const db = new Dexie('SamplesDataDb') as Dexie & {
  samples: EntityTable<
    SampleData,
    'url' // primary key (for the typings only)
  >
}

db.version(1).stores({
  samples: '++id, name, url', // primary key and indexed keys (for the runtime!)
})

// v2:
// - use ArrayBuffer instead of Blob for Safari
// - use URL as primary key (since a query by URL is used to decide whether to fetch)
db.version(2)
  .stores({
    samples: 'url, name',
  })
  .upgrade(async (tx) => {
    // Clear old blob-based data - samples will be re-downloaded with new schema
    await tx.table('samples').clear()
  })

export type { SampleData }
export { db }
