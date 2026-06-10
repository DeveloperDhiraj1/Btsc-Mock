# Use standard LTS node alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency catalogs
COPY package*.json ./

# Install dependencies (only production for smaller size)
RUN npm install --only=production

# Copy remaining source code files
COPY . .

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Run command
CMD ["npm", "start"]
