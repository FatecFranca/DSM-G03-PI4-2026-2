# 1. Imagem base oficial do Node.js (versão 18 baseada no Alpine para ser mais leve)
FROM node:18-alpine

# 2. Instalar o OpenSSL e certificados (obrigatório para o Prisma rodar no Alpine Linux)
RUN apk add --no-cache openssl

# 3. Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# 4. Copiar os arquivos de pacote E a pasta do Prisma primeiro
COPY package*.json ./
COPY prisma ./prisma/

# 5. Instalar todas as dependências (agora o Prisma acha o schema se rodar no postinstall)
RUN npm install

# 6. Garantir a geração do Prisma Client
RUN npx prisma generate

# 7. Copiar todo o restante do código-fonte do backend
COPY . .

# 8. Definir variáveis de ambiente padrão para produção
ENV NODE_ENV=production
ENV PORT=8080

# 9. Expor a porta que o serviço utiliza por padrão
EXPOSE 8080

# 10. Comando para iniciar a aplicação
CMD ["npm", "start"]