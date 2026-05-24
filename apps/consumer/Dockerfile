FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/consumer/package.json apps/consumer/
COPY apps/api/prisma apps/api/prisma
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @notes/consumer --workspace @notes/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/consumer apps/consumer
RUN npm run prisma:generate -w @notes/consumer
RUN npm run build -w @notes/consumer

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/consumer/dist ./apps/consumer/dist
COPY --from=builder /app/apps/consumer/package.json ./apps/consumer/
EXPOSE 3001
CMD ["node", "apps/consumer/dist/main.js"]
