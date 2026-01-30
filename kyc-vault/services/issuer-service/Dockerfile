FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.20.0

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy all source packages and services
COPY packages ./packages
COPY services ./services

# Install all dependencies in frozen lockfile mode
RUN pnpm install --frozen-lockfile

# Build projects - run tsc from /app
RUN ./node_modules/.bin/tsc -p packages/common-types/tsconfig.json || true
RUN ./node_modules/.bin/tsc -p services/issuer-service/tsconfig.json || true

EXPOSE 3002
CMD ["node", "services/issuer-service/dist/main.js"]
