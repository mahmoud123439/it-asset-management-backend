import { UserRole } from "@prisma/client";
import { prisma } from "../prisma";

export const isUserInWorkGroup = async (
  userId: number,
  slug: string,
): Promise<boolean> => {
  const membership = await prisma.userWorkGroup.findFirst({
    where: { userId, group: { slug } },
    select: { userId: true },
  });

  return Boolean(membership);
};

export const groupSlugForRole = (role: UserRole): string => {
  switch (role) {
    case "ADMIN":
    case "IT_ENGINEER":
    case "IT_SUPPORT":
      return "it";
    case "MANAGER":
      return "managers";
    case "EMPLOYEE":
      return "employees";
  }
};
