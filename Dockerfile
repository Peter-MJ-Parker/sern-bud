FROM node:lts-alpine AS build

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY .env ./
COPY sern.config.json ./
RUN yarn install

COPY . .
RUN yarn run build

FROM node:lts-alpine AS final

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/sern.config.json ./sern.config.json
CMD ["node", "dist/Structures/client/index.js"]
