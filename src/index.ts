import { Context, Hono } from 'hono';
import { EventValidator } from './event.validator';

type AnalysisEvent = {
  type: "CREATE_ANALYSIS";
  payload: {
    analysisId: string;
  };
}

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/webhook/analysis', async (c: Context<HonoType>) => {
  const event: AnalysisEvent = await c.req.json()

  const validate = EventValidator.validateAnalysis(event)
  try {
    if (!validate.success) {
      console.log("Evento inválido:", event)
      return c.json({
        success: false,
        error: 'Evento inválido: formato JSON esperado',
        message: validate.data
      }, 400)
    }

    if (!event || typeof event !== 'object') {
      console.log("Evento inválido:", event)
      return c.json({
        success: false,
        error: 'Evento inválido: formato JSON esperado'
      }, 400)
    }

    if (!event.payload?.analysisId) {
      console.log("analysisId faltando no payload")
      return c.json({
        success: false,
        error: 'analysisId é obrigatório no payload'
      }, 400)
    }

    const analysis = await c.env.DB.prepare('SELECT * FROM analyses WHERE id = ?').bind(event.payload.analysisId).first()

    if (!analysis) {
      return c.json({
        success: false,
        error: 'Análise não encontrada'
      }, 404)
    }

    const image = await c.env.R2.get(analysis.imageUrl as string)

    let result

    if (image) {
      const formData = new FormData();

      const blob = await image.blob();
      formData.append('file', blob, 'image.jpg');

      const response = await fetch('https://asd-classification-ai.onrender.com/predict', {
          method: 'POST',
          body: formData,
      })

      result = await response.json();
      console.log(result)
    }

    if (result) {
      await c.env.DB.prepare('UPDATE analyses SET result = ? WHERE id = ?').bind(JSON.stringify(result), event.payload.analysisId).run()
      await c.env.DB.prepare('UPDATE analyses SET status = ? WHERE id = ?').bind('COMPLETED', event.payload.analysisId).run()
    }

    return c.json({
      success: true,
      message: 'Evento processado com sucesso',
      analysis,
      result
    })
  } catch (error) {
    console.error('Erro no processamento:', error)

    await c.env.DB.prepare('UPDATE analyses SET status = ? WHERE id = ?').bind('COMPLETED', event.payload.analysisId).run()

    return c.json({
      success: false,
      message: 'Erro interno do servidor',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    }, 500)
  }
})

export default app
