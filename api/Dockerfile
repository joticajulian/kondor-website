FROM node:16.14.2
WORKDIR /api
ADD . ./
RUN yarn install --frozen-lockfile --silent && yarn cache clean
CMD ["yarn", "start"]