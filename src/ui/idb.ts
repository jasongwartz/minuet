import Dexie, { type EntityTable } from 'dexie'

interface SampleData {
  id: number
  name: string
  url: string
  blob: Blob
}

const db = new Dexie('SamplesDataDb') as Dexie & {
  samples: EntityTable<
    SampleData,
    'id' // primary key (for the typings only)
  >
}

// Schema declaration:
db.version(1).stores({
  samples: '++id, name, url', // primary key "id" (for the runtime!)
})

export type { SampleData }
export { db }
