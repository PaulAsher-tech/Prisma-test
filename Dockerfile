# Dockerfile for Next.js + Prisma + PostgreSQL
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client during build
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=12000
ENV HOSTNAME=0.0.0.0

# Expose the correct port
EXPOSE 12000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:12000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
