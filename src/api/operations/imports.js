/** GraphQL operation for the bulk-import surface (Phase 4 Item F). */
import { gql } from '@apollo/client/core'

export const BULK_IMPORT_FROM_SOURCE = gql`
  mutation BulkImportFromSource($source: ImportSource!, $payload: String!) {
    bulkImportFromSource(source: $source, payload: $payload) {
      source
      importedTasks
      importedProjects
      failedCount
      failed {
        index
        label
        reason
      }
    }
  }
`
