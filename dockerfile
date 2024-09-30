FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD ["node", "script.js"]