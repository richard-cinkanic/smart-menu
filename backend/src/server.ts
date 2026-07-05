import { app } from "./app.js";
import { prisma } from "./prisma/client.js";
import { env } from "./utils/env.js";

const server = app.listen(env.PORT, () => { console.log(`SmartMenuAI API running on http://localhost:${env.PORT}`); });
async function shutdown() { await prisma.$disconnect(); server.close(() => process.exit(0)); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
