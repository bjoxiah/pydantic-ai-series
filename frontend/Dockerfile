FROM node:22-alpine

WORKDIR /app

# Enable corepack
RUN corepack enable

# Pin pnpm version
RUN corepack prepare pnpm@10.12.1 --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy app source
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]