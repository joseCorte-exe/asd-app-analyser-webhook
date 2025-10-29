import { R2Bucket } from "@cloudflare/workers-types"

export let R2: R2Bucket | null = null

export function setR2(r2: R2Bucket) {
  R2 = r2
}