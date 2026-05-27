/**
 * Diff a new `leftovers` payload against the previously-saved one. Returns
 * only the *new* additions per kind so the carry-forward dispatcher fires
 * reschedule / delete mutations exactly once per decision, even if the user
 * saves the review twice without changing their leftover actions.
 *
 * @param {object|null} prev - previously saved `responses.leftovers` or null
 * @param {object} next - the about-to-save `responses.leftovers`
 * @returns {{ tomorrow: string[], picked: {id:string,date:string}[], dropped: string[] }}
 */
export function diffLeftovers(prev, next) {
  const prevTomorrow = new Set(prev?.tomorrow ?? [])
  const prevDropped = new Set(prev?.dropped ?? [])
  const prevPickedKey = new Set((prev?.picked ?? []).map(p => `${p.id}|${p.date}`))

  return {
    tomorrow: (next.tomorrow ?? []).filter(id => !prevTomorrow.has(id)),
    dropped: (next.dropped ?? []).filter(id => !prevDropped.has(id)),
    picked: (next.picked ?? []).filter(p => !prevPickedKey.has(`${p.id}|${p.date}`))
  }
}
