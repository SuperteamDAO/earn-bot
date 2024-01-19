FROM node:20
RUN mkdir earn-bot
WORKDIR earn-bot/
ENV DISCORD_TOKEN="bot-token"
ENV DB_HOST="db-host"
ENV DB_USER="db-user"
ENV DB_PASS="db-pass"
ENV DB_NAME="db-name"
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD [ "node", "dist/index.js" ]