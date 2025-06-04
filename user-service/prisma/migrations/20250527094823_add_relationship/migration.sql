-- CreateTable
CREATE TABLE "Relationship" (
    "Id" TEXT NOT NULL,
    "SenderId" TEXT NOT NULL,
    "ReceiverId" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'pending',
    "Type" TEXT NOT NULL DEFAULT 'follow',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("Id")
);

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_SenderId_fkey" FOREIGN KEY ("SenderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_ReceiverId_fkey" FOREIGN KEY ("ReceiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
