import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import { initSocket } from './lib/socket.js';
import { startRabbitMqConsumers } from './lib/rabbitmq.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

startRabbitMqConsumers().catch((error) => {
    console.error('Erro ao iniciar consumidores RabbitMQ:', error);
});
