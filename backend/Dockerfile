FROM node:18-alpine
WORKDIR /app
COPY package*.json ./

# Install dependencies and explicitly add exceljs to ensure it's present
RUN npm install

COPY . .
EXPOSE 8080
CMD ["node", "server.js"]