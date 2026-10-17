CREATE TABLE "WorkGroup" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserWorkGroup" (
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "UserWorkGroup_pkey" PRIMARY KEY ("userId", "groupId")
);

CREATE UNIQUE INDEX "WorkGroup_slug_key" ON "WorkGroup"("slug");
CREATE INDEX "UserWorkGroup_groupId_idx" ON "UserWorkGroup"("groupId");

ALTER TABLE "UserWorkGroup"
ADD CONSTRAINT "UserWorkGroup_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserWorkGroup"
ADD CONSTRAINT "UserWorkGroup_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "WorkGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "WorkGroup" ("slug", "name") VALUES
    ('it', 'قسم IT'),
    ('managers', 'المديرون'),
    ('employees', 'الموظفون');

INSERT INTO "UserWorkGroup" ("userId", "groupId")
SELECT u."id", g."id"
FROM "User" u
JOIN "WorkGroup" g ON g."slug" = CASE
    WHEN u."role" IN ('IT_ENGINEER', 'IT_SUPPORT') THEN 'it'
    WHEN u."role" = 'ADMIN' THEN 'managers'
    ELSE 'employees'
END
WHERE u."deletedAt" IS NULL;
