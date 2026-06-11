// App config, middlewares
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import routes from './routes'

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api', routes)

// 404
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }))

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

export default app
