import { prisma } from "../src/lib/prisma.js";

async function main() {
  try {
    // Run one read query
    const projects = await prisma.project.findMany();
    console.log(`Successfully fetched ${projects.length} projects.`);
    console.log("✅ Connected");
  } catch (error) {
    console.error("Database connection verification failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
