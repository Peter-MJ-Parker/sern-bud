FROM node:lts

WORKDIR /src

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

CMD node dist/Structures/client/index.js