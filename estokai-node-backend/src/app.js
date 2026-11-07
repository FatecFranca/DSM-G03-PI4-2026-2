import express from 'express';
import cors from 'cors';
import compression from 'compression';
import clientesRoutes from './routes/clientesRoutes.js';
import fornecedoresRoutes from './routes/fornecedoresRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';
import pedidosRoutes from './routes/pedidosRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import movimentacoesRoutes from './routes/movimentacaoRoutes.js';
import authRoutes from "./routes/authRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import telemetriaRoutes from "./routes/telemetriaRoutes.js"
import notificacoesRoutes from './routes/notificacoesRoutes.js'

const app = express();

app.use(compression()); // Comprime respostas (gzip, brotli)
app.use(express.json({ limit: '10mb' })); // Limita tamanho do payload

// Middleware de cache simples
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, no-cache')
  } else {
    res.setHeader('Cache-Control', 'no-store')
  }
  next()
})
app.use(cors({
  origin: ['http://localhost:3000',
    'https://estokai-ll6q.vercel.app',
    'http://158.23.60.48'
  ],
  credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API funcionando.',
    timestamp: new Date().toISOString()
  });
});

app.use('/clientes', clientesRoutes);
app.use('/fornecedores', fornecedoresRoutes);
app.use('/produtos', produtosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/telemetria', telemetriaRoutes);
app.use('/notificacoes', notificacoesRoutes);
app.use("/auth", authRoutes)
app.use("/admin", adminRoutes)

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

export default app;
