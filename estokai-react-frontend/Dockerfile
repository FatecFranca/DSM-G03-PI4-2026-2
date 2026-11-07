FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NODE_ENV=production \
    PORT=3000

RUN npm run build && npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
