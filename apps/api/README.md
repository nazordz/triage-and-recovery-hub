# Prisma Installation

```bash
npx prisma init --db --output generated/prisma
```

## Apply migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```
