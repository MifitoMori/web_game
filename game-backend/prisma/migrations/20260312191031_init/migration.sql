-- CreateTable
CREATE TABLE "Healthcheck" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Healthcheck_pkey" PRIMARY KEY ("id")
);
