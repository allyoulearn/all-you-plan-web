/**
 * Mock fixture registry.
 * Merges every domain's fixture registry into one object keyed by GraphQL root
 * field name. Consumed by the mock link in `src/api/apollo.js`.
 */
import { registry as auth } from './fixtures/auth.js'

export const mockRegistry = {
  ...auth
}
