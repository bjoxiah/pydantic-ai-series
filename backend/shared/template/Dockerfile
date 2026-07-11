FROM node:22.13.0

RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    python3 \
    python3-pip \
    sudo \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
    expo-cli \
    create-expo-app \
    serve \
    snack-sdk

# NODE_PATH ensures require('@expo/snack-sdk') resolves from any working directory
ENV NODE_PATH=/usr/local/lib/node_modules:/usr/lib/node_modules
ENV NPM_CONFIG_CACHE=/opt/npm-cache
ENV EXPO_NO_TELEMETRY=1
ENV CI=1

WORKDIR /home/user

CMD ["bash"]