-- CreateTable
CREATE TABLE "CampaignStar" (
    "walletId" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,

    CONSTRAINT "CampaignStar_pkey" PRIMARY KEY ("walletId","faction","level")
);
