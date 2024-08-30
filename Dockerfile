# Build stage for the frontend
FROM node:18 AS frontend-build
WORKDIR /usr/src/app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Main application stage
FROM node:18
WORKDIR /usr/src/app

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy backend package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Copy the built frontend from the frontend-build stage
COPY --from=frontend-build /usr/src/app/client/dist ./client/dist

# Expose the port your backend runs on
EXPOSE 5000

# Command to run the backend
CMD ["node", "index.js"]