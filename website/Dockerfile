FROM node:19-alpine as base
WORKDIR /usr/src/app
COPY package*.json yarn.lock ./
COPY src src
COPY public public
COPY index.html tsconfig*.json vite.config.ts ./
ARG VITE_NETWORK
ARG VITE_RPC_NODES
ARG VITE_NFT_CONTRACT_ID
ARG VITE_WEBSITE_VERSION
ARG VITE_AUCTION_PERIOD
ARG VITE_POLL_CONTRACT_ID
ARG VITE_POB_CONTRACT_ID
ARG VITE_VHP_CONTRACT_ID
ARG VITE_KOIN_CONTRACT_ID
ARG VITE_VAPOR_CONTRACT_ID
ARG VITE_BP_NAMES
ARG VITE_JGAPOOL_GOV_ID
ARG VITE_JGAPOOL_1_ID
ARG VITE_JGAPOOL_2_ID
ARG VITE_NICKNAMES_CONTRACT_ID
RUN yarn install
RUN yarn build
EXPOSE 8080
CMD ["yarn", "preview", "--port", "8080"]