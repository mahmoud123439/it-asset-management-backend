DELETE FROM "UserWorkGroup" uwg
USING "User" u, "WorkGroup" g
WHERE uwg."userId" = u."id"
  AND uwg."groupId" = g."id"
  AND u."role" = 'ADMIN'
  AND g."slug" = 'managers';

INSERT INTO "UserWorkGroup" ("userId", "groupId")
SELECT u."id", g."id"
FROM "User" u
JOIN "WorkGroup" g ON g."slug" = CASE
    WHEN u."role" IN ('ADMIN', 'IT_ENGINEER', 'IT_SUPPORT') THEN 'it'
    WHEN u."role" = 'MANAGER' THEN 'managers'
    ELSE 'employees'
END
WHERE u."deletedAt" IS NULL
ON CONFLICT DO NOTHING;
