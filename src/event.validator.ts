import z from "zod"

export class EventValidator {
  static validateAnalysis(event: any) {
    const schema = z.object({
      type: z.string(),
      payload: z.object({
        analysisId: z.string(),
      }),
    })

    return schema.safeParse(event)
  }
}
