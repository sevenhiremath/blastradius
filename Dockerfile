FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@11.25.0 && pnpm install --frozen-lockfile --prod
COPY src ./src
COPY public ./public
ENV HOST=0.0.0.0
EXPOSE 4317
CMD ["node", "src/server.js"]
