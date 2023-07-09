# Base image
FROM node:20.2.0-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./
COPY .env ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY ./api ./api

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
