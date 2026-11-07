# Estokai

Projeto Integrador do curso de Desenvolvimento de Software Multiplataforma (DSM) — FATEC Franca.

O **Estokai** é uma solução para gestão de estoque que reúne uma aplicação web, um aplicativo móvel, uma API e um serviço de Internet das Coisas (IoT). O sistema permite acompanhar produtos, movimentações, pedidos, fornecedores, clientes e dados de sensores em tempo real.

## Acesso à demonstração

- Servidor: [158.23.60.48](http://158.23.60.48)
- Aplicação web: [http://158.23.60.48/](158.23.60.48)
- API: [http://158.23.60.48/api](158.23.60.48)
- Vídeo de apresentação: **link a ser adicionado após a gravação**.


## Funcionalidades

- Cadastro e consulta de produtos, clientes e fornecedores;
- Controle de entradas, saídas e movimentações de estoque;
- Gestão de pedidos;
- Painel administrativo, relatórios e estatísticas;
- Autenticação de usuários;
- Atualização em tempo real com Socket.IO;
- Recebimento de telemetria de sensores IoT via MQTT e RabbitMQ;
- Simulação de dispositivos ESP32 no Wokwi;
- Aplicativo móvel para acesso às funcionalidades do sistema.

## Arquitetura

```text
ESP32 / Wokwi
      │ MQTT
      ▼
Serviço IoT (Spring Boot) ──► RabbitMQ ──► API Node.js ──► Banco de dados
                                                       │
                                            Socket.IO  │
                                                       ▼
                                      Frontend Web e Aplicativo Mobile
```

## Estrutura do repositório

| Pasta | Descrição |
| --- | --- |
| `estokai-react-frontend/` | Interface web desenvolvida com Next.js e React. |
| `estokai-node-backend/` | API REST em Node.js, Express, Prisma, Socket.IO e RabbitMQ. |
| `estokai-iot-service/iot-service/` | Serviço Java/Spring Boot que recebe telemetria MQTT e publica eventos no RabbitMQ. |
| `estokai-iot-service/iot-service/wokwi/` | Simulador Wokwi com ESP32, sensores de presença, temperatura/umidade e balanças. |
| `estokai-mobile/` | Aplicativo mobile construído com Expo e React Native. |

## Tecnologias utilizadas

- Next.js, React e Tailwind CSS;
- Node.js, Express, Prisma e Socket.IO;
- Java, Spring Boot e Maven;
- MQTT (Mosquitto) e RabbitMQ;
- ESP32, Wokwi, DHT22 e HX711;
- Expo e React Native;
- Docker e Docker Compose.

## Como executar localmente

### 1. Pré-requisitos

- Node.js e npm;
- Java 17+ e Maven (ou Maven Wrapper);
- Docker e Docker Compose;
- Um banco de dados configurado para a API;
- Opcionalmente, VS Code com PlatformIO e Wokwi para executar a simulação IoT.

### 2. Variáveis de ambiente

Não envie arquivos `.env` ao repositório. Use os exemplos existentes como base:

```bash
cp estokai-node-backend/.env.example estokai-node-backend/.env
cp estokai-iot-service/iot-service/.env.example estokai-iot-service/iot-service/.env
```

Preencha os valores de banco de dados, JWT, Cloudinary e mensageria de acordo com o ambiente. O `.env` é ignorado pelo Git para proteger credenciais.

### 3. Serviços de mensageria e IoT

```bash
cd estokai-iot-service/iot-service
docker compose up -d --build
```

O comando inicia Mosquitto, RabbitMQ e o serviço IoT. A interface de gerenciamento do RabbitMQ usa a porta `15672` por padrão.

### 4. API backend

```bash
cd estokai-node-backend
npm install
npm run dev
```

Por padrão, a API é iniciada na porta `3001`.

### 5. Frontend web

```bash
cd estokai-react-frontend
npm install
npm run dev
```

Para apontar o frontend para uma API remota, defina `NEXT_PUBLIC_API_URL`, por exemplo:

```bash
NEXT_PUBLIC_API_URL=http://158.23.60.48:3001 npm run dev
```

### 6. Aplicativo mobile

```bash
cd estokai-mobile
npm install
npm start
```

Use o Expo Go ou um emulador para abrir o aplicativo.

### 7. Simulador IoT (Wokwi)

Consulte as instruções completas em [estokai-iot-service/iot-service/README.md](estokai-iot-service/iot-service/README.md). Em resumo, gere o firmware com PlatformIO e inicie o Wokwi na pasta do serviço IoT.

## Observações para avaliação

- Este repositório reúne os serviços da equipe em uma única entrega.
- Cada serviço possui seu próprio arquivo de configuração e exemplos de variáveis de ambiente quando necessário.
- Credenciais e arquivos gerados localmente não fazem parte do versionamento.

## Equipe

Projeto desenvolvido pela equipe DSM-G03-PI4-2026-2 — FATEC Franca.

- Guilherme Porto de Melo Junqueira
- Leonardo Bonamin
- Murilo Pessoni
- Francisco Rocha
