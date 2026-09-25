FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:22-alpine
LABEL org.opencontainers.image.source https://github.com/kunalmehta14/Ladon-ModuleStore_API
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Copy compiled code and dependency manifests
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/package-lock.json ./
# Install production dependencies only
RUN npm ci --omit=dev
RUN chown -R appuser:appgroup /app
USER appuser
# Set environment to production
EXPOSE 3500
# Start the application
CMD ["node", "dist/index.js"]