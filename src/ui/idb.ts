import Dexie, { type EntityTable } from 'dexie'

interface SampleData {
  id: number
  name: string
  url: string
  blob: Blob
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const db = new Dexie('SamplesDataDb') as Dexie & {
  samples: EntityTable<
    SampleData,
    'id' // primary key (for the typings only)
  >
}

db.version(1).stores({
  samples: '++id, name, url', // primary key and indexed keys (for the runtime!)
})

export type { SampleData }
export { db }
