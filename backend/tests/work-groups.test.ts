import { UserRole } from "@prisma/client";
import { groupSlugForRole } from "../src/utils/work-groups";

describe("Work group role mapping", () => {
  test.each([
    [UserRole.ADMIN, "it"],
    [UserRole.IT_ENGINEER, "it"],
    [UserRole.IT_SUPPORT, "it"],
    [UserRole.MANAGER, "managers"],
    [UserRole.EMPLOYEE, "employees"],
  ])("maps %s to %s", (role, slug) => {
    expect(groupSlugForRole(role)).toBe(slug);
  });
});
