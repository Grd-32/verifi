FROM node:20-alpine AS build

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN CI=true pnpm install --frozen-lockfile

RUN cd apps/api && pnpm run build 2>/dev/null || true

FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN CI=true pnpm install --prod --frozen-lockfile

COPY --from=build /app/apps/api/dist ./apps/api/dist 2>/dev/null || true

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["pnpm", "start"]