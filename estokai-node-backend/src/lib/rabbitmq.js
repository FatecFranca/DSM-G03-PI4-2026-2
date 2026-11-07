import amqp from "amqplib"
import { processTelemetryMessage } from "../services/telemetriaService.js"

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://estokai:estokai@localhost:5673"
const TELEMETRY_QUEUE = process.env.RABBITMQ_TELEMETRY_QUEUE || "estokai.application.telemetry"
const RETRY_DELAY_MS = Number(process.env.RABBITMQ_RETRY_DELAY_MS || 5000)

let connection
let channel

export async function startRabbitMqConsumers() {
  if (channel) {
    return
  }

  try {
    connection = await amqp.connect(RABBITMQ_URL)
  } catch (error) {
    console.error(`RabbitMQ indisponivel. Nova tentativa em ${RETRY_DELAY_MS}ms:`, error.message)
    setTimeout(() => {
      startRabbitMqConsumers().catch((retryError) => {
        console.error("Erro ao reiniciar consumidor RabbitMQ:", retryError)
      })
    }, RETRY_DELAY_MS)
    return
  }

  channel = await connection.createChannel()

  connection.on("close", () => {
    connection = undefined
    channel = undefined
    console.error(`Conexao RabbitMQ fechada. Nova tentativa em ${RETRY_DELAY_MS}ms.`)
    setTimeout(() => {
      startRabbitMqConsumers().catch((retryError) => {
        console.error("Erro ao reiniciar consumidor RabbitMQ:", retryError)
      })
    }, RETRY_DELAY_MS)
  })

  await channel.assertQueue(TELEMETRY_QUEUE, { durable: true })
  await channel.prefetch(10)

  await channel.consume(TELEMETRY_QUEUE, async (message) => {
    if (!message) {
      return
    }

    try {
      await processTelemetryMessage(message)
      channel.ack(message)
    } catch (error) {
      console.error("Erro ao processar telemetria do RabbitMQ:", error)
      channel.nack(message, false, false)
    }
  })

  console.log(`Consumidor RabbitMQ iniciado. queue=${TELEMETRY_QUEUE}`)
}
