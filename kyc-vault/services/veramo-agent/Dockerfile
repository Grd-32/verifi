FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY services ./services

RUN pnpm install --frozen-lockfile

RUN ./node_modules/.bin/tsc -p packages/common-types/tsconfig.json || true
RUN ./node_modules/.bin/tsc -p services/veramo-agent/tsconfig.json || true

EXPOSE 3001
CMD ["node", "services/veramo-agent/dist/index.js"]
