FROM node:20-slim AS base
WORKDIR /app
# sharp needs these at runtime on slim images
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM base AS api
CMD ["npm", "run", "start"]
