FROM node:20
RUN mkdir earn-bot
WORKDIR /earn-bot
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD [ "node", "dist/index.js" ]
