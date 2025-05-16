# use Node.js LTS VERSION  
FROM node:18-alpine
#set working directory
WORKDIR /app
#install dependencies
COPY package.json ./
RUN npm install

#copy all files
COPY . .

# Build the Typescript code
RUN npm run build
EXPOSE 5000
#start the server
CMD ["npm", "start"]

