// While riding: how close are we to the stop, and is it time to get off?
import { km } from './trip.js'

export const SOON = 0.5 // km: "get ready" alert
export const HERE = 0.15 // km: "you're here, para po"
const PASSED = 0.3 // km past the closest point we reached
const WEAK = 0.2 // km: GPS fixes less accurate than this don't trigger anything
const RANK = { riding: 0, soon: 1, here: 2 }

/**
 * One GPS fix -> next ride state { d, min, phase, weak }.
 * fix: { lat, lng, acc } with acc in km. Phases only move forward (riding → soon → here), so GPS jitter
 * can't fire the same alert twice; "passed" wins once we've clearly moved away after getting close.
 */
export function rideStep(prev, fix, stop) {
  const d = km(fix, stop)
  const was = prev?.phase ?? 'riding'
  if (fix.acc > WEAK) return { d, min: prev?.min ?? Infinity, phase: was, weak: true }
  const min = Math.min(prev?.min ?? Infinity, d)
  if (was === 'passed' || (min <= PASSED && d > min + PASSED)) return { d, min, phase: 'passed', weak: false }
  const now = d <= HERE ? 'here' : d <= SOON ? 'soon' : 'riding'
  return { d, min, phase: RANK[now] > RANK[was] ? now : was, weak: false }
}
