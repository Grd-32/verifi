FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile --filter kyc-vault-web...

EXPOSE 3000
CMD ["node", "apps/web/node_modules/.bin/react-scripts", "start", "--project-root", "apps/web"]