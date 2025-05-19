# Use Node.js LTS VERSION  
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy all files
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose app port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
