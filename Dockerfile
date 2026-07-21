FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 3000
CMD ["npm", "start"]
