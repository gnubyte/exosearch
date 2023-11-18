# Base image
FROM node:20.2.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json .
COPY .env .
COPY . .

# Install dependencies
RUN npm install

# Copy application files

# Expose port
EXPOSE 3000

# Start the application with nodemon
CMD ["npm", "start"]
