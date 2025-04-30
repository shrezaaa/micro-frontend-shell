FROM node:18-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY . .
RUN npm install
RUN npx nx build gateway
WORKDIR /app/dist/apps/gateway
EXPOSE 9000

CMD ["node", "main.js"]
