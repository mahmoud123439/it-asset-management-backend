import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

/**
 * Creates the first ADMIN (or promotes an existing user to ADMIN).
 * Set ADMIN_RESET_PASSWORD=true to also change an existing user's password.
 */
const main = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const resetPassword = process.env.ADMIN_RESET_PASSWORD === "true";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const admin = await tx.user.upsert({
      where: { email },
      update: {
        role: "ADMIN",
        microsoft365LicenseAssigned: true,
        ...(resetPassword ? { password: hashedPassword } : {}),
      },
      create: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        microsoft365LicenseAssigned: true,
      },
    });
    const group = await tx.workGroup.findUniqueOrThrow({
      where: { slug: "it" },
    });

    await tx.userWorkGroup.upsert({
      where: {
        userId_groupId: { userId: admin.id, groupId: group.id },
      },
      update: {},
      create: { userId: admin.id, groupId: group.id },
    });

    return admin;
  });

  console.log(`Admin ready: ${user.email}`);
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
