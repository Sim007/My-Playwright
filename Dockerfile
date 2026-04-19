FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies (this installs for all workspaces)
RUN npm ci --workspaces

# Copy all source files
COPY . .

ENV CI=true

# Run all tests across all showcase workspaces
CMD ["npm", "test"]
