/**
 * Mock fixtures for account management mutations.
 *
 * `deleteAccount` and `changePassword` are exposed from `src/api/operations/account.js`.
 * Both mutations return a Boolean — the fixtures resolve to true so the UI
 * flows that depend on a success acknowledgement can be exercised.
 */

export const registry = {
  deleteAccount: () => ({ deleteAccount: true }),
  changePassword: () => ({ changePassword: true })
}
