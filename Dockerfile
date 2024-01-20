FROM node:14

WORKDIR /earn-bot

ENV DISCORD_TOKEN="bot-token" \
    DB_HOST="db-host" \
    DB_USER="db-user" \
    DB_PASS="db-pass" \
    DB_NAME="db-name"

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

USER node

CMD ["node", "dist/index.js"]
