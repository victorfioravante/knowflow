// Entry point Express
import app from './app'

const port = Number(process.env.PORT ?? 3003)

app.listen(port, () => {
  console.log(`Knowflow API rodando em http://localhost:${port}`)
})
