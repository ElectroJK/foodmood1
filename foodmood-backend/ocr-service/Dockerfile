FROM node:20-alpine
RUN apk add --no-cache vips-dev build-base python3
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 4100
CMD ["node", "src/server.js"]
