FROM node:22-slim AS server-dev
WORKDIR /app/server
COPY server/package*.json ./
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
COPY server/ .
EXPOSE 5000
CMD ["node", "index.js"]

FROM node:22-slim AS client-dev
WORKDIR /app/client
COPY client/package*.json ./
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
COPY client/ .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:22-slim AS client-build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app/client
COPY client/package*.json ./
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
COPY client/ .
RUN npm run build

FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --legacy-peer-deps
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
