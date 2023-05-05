FROM node:16.19.1-alpine3.17@sha256:95a849eafc573ad0d972fd67c569369e7aa94d55a21ede3b972e3137e5f8e43a
WORKDIR /api
ADD . ./
RUN yarn install --frozen-lockfile --silent && yarn cache clean
CMD ["yarn", "start"]