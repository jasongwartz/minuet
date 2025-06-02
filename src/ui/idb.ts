import Dexie, { type EntityTable } from 'dexie'

export interface SampleData {
  id: string
  name: string
  url: string
  blob: Blob
}

export interface Project {
  id: string
  language: string
  createdAt: Date
}

export interface ProjectVersion {
  id: string
  projectId: string
  code: string
  previousVersion?: string
  nextVersion?: string
  createdAt: Date
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const db = new Dexie('MinuetDb') as Dexie & {
  // Second type arg is primary key, for typings only
  samples: EntityTable<SampleData, 'id'>
  projects: EntityTable<Project, 'id'>
  projectVersions: EntityTable<ProjectVersion, 'id'>
}

db.version(1).stores({
  // primary key and indexed keys (for the runtime!)
  samples: 'id, name, url',
  projects: 'id, language, createdAt',
  projectVersions: 'id, projectId, createdAt',
})

export const createProjectWithVersion = async (language: string, code: string) => {
  return await db.transaction('rw', db.projects, db.projectVersions, async () => {
    const projectId = await db.projects.add({
      id: crypto.randomUUID(),
      language,
      createdAt: new Date(),
    })
    if (!projectId) {
      throw new Error('Failed to insert project (no projectId returned)')
    }

    const projectVersionId = await db.projectVersions.add({
      id: crypto.randomUUID(),
      projectId,
      code,
      createdAt: new Date(),
    })

    if (!projectVersionId) {
      throw new Error(
        `Failed to record projectVersion for projectId ${projectId} (no projectVersionId returned)`,
      )
    }
    return { projectId, projectVersionId }
  })
}

export const updateProjectCode = async (projectId: string, code: string) => {
  return await db.transaction('rw', db.projectVersions, async () => {
    const latestVersion = (
      await db.projectVersions.where('projectId').equals(projectId).sortBy('id')
    ).pop()

    const newVersionId = await db.projectVersions.add({
      id: crypto.randomUUID(),
      projectId,
      code: code,
      createdAt: new Date(),
      previousVersion: latestVersion?.id, // link previous version if it existed
    })

    if (latestVersion) {
      // If there was a previous version, update its `nextVersion`
      await db.projectVersions.update(latestVersion.id, { nextVersion: newVersionId })
    }

    return newVersionId
  })
}
