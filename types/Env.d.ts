import { Fetcher } from "@cloudflare/workers-types";

declare global {
  interface Env {
    DB: D1Database;
    R2: R2Bucket;
    ANALYSIS_SERVICE: Fetcher;
    ENVIRONMENT: string;
  }

  declare namespace NodeJS {
    interface ProcessEnv {
      DB: D1Database;
      ENVIRONMENT: string;
    }
  }
}

export { };
