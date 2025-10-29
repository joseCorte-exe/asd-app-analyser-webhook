import { D1Database } from '@cloudflare/workers-types'

export let d1: D1Database

export function initializeD1(db: D1Database) {
  d1 = db
}