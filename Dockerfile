FROM node:18
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 50901
CMD [ "node", "server.js" ]