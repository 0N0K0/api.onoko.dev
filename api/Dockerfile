FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
RUN apk add --no-cache libc6-compat build-base vips-dev python3
RUN npm install --include=optional --os=linux --libc=musl --cpu=x64
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
