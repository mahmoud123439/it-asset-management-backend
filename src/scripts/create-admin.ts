import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

/**
 * Creates the first ADMIN (or promotes an existing user to ADMIN).
 * Usage:  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
 * The password of an already existing user is never overwritten.
 */
const main = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, password: hashedPassword, role: "ADMIN" },
  });

  console.log(`Admin ready: ${user.email}`);
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
