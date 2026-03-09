-- CreateEnum
CREATE TYPE "BrandMemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('BRAND_INFO', 'PRODUCTS', 'FAQ', 'TONE', 'ESCALATION', 'OFF_TOPIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'CLAUDE');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('AI_ACTIVE', 'HUMAN_TAKEOVER', 'CLOSED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('CONTACT', 'AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'STICKER', 'LINK', 'MEDIA_CARD');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('HASHTAG', 'KEYWORD');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('PENDING', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandMember" (
    "id" TEXT NOT NULL,
    "role" "BrandMemberRole" NOT NULL DEFAULT 'EDITOR',
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "BrandMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotebookSection" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "plainText" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotebookSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotebookVersion" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "NotebookVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotebookConfig" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" "AIProvider" NOT NULL DEFAULT 'OPENAI',
    "fallbackProvider" "AIProvider",
    "fallbackMessage" TEXT NOT NULL DEFAULT '感谢您的讯息，我们会尽快回覆您。',
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,

    CONSTRAINT "NotebookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplySettings" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "dmFrequencyLimit" INTEGER,
    "dmFrequencyWindowMins" INTEGER,
    "replyProbability" INTEGER NOT NULL DEFAULT 100,
    "restTimeStart" TEXT,
    "restTimeEnd" TEXT,
    "restTimeTimezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "contextWindowSize" INTEGER NOT NULL DEFAULT 20,
    "simulateTypingDelay" BOOLEAN NOT NULL DEFAULT false,
    "spamFilter" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReplySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "platformThreadId" TEXT NOT NULL,
    "contactPlatformId" TEXT NOT NULL,
    "contactName" TEXT,
    "contactAvatar" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'AI_ACTIVE',
    "humanTakeoverBy" TEXT,
    "qualityFlags" TEXT[],
    "summary" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" VARCHAR(300),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "platformMessageId" TEXT,
    "senderType" "SenderType" NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentTrigger" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platformAccountId" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "triggerType" "TriggerType" NOT NULL,
    "postId" TEXT,
    "hashtag" TEXT,
    "keywords" TEXT[],
    "dmContent" TEXT,
    "commentReply" TEXT,
    "useAI" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UncoveredTopic" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "sampleMessages" JSONB NOT NULL DEFAULT '[]',
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" "TopicStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedSection" "SectionType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UncoveredTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "contactPlatformId" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "tags" TEXT[],
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaLibrary" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "sectionType" "SectionType",
    "inputMessage" TEXT NOT NULL,
    "expectedBehavior" TEXT,
    "sourceConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "notebookSnapshot" JSONB NOT NULL,
    "totalCases" INTEGER NOT NULL,
    "changedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRunResult" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "aiReply" TEXT NOT NULL,
    "previousReply" TEXT,
    "hasChanged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestRunResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "BrandMember_userId_brandId_key" ON "BrandMember"("userId", "brandId");

-- CreateIndex
CREATE INDEX "PlatformAccount_brandId_idx" ON "PlatformAccount"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_platform_platformUserId_key" ON "PlatformAccount"("platform", "platformUserId");

-- CreateIndex
CREATE INDEX "NotebookSection_brandId_idx" ON "NotebookSection"("brandId");

-- CreateIndex
CREATE INDEX "NotebookVersion_brandId_idx" ON "NotebookVersion"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "NotebookConfig_brandId_key" ON "NotebookConfig"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplySettings_brandId_key" ON "ReplySettings"("brandId");

-- CreateIndex
CREATE INDEX "Conversation_brandId_idx" ON "Conversation"("brandId");

-- CreateIndex
CREATE INDEX "Conversation_brandId_status_idx" ON "Conversation"("brandId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_platformAccountId_platformThreadId_key" ON "Conversation"("platformAccountId", "platformThreadId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_platformMessageId_key" ON "Message"("platformMessageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "CommentTrigger_brandId_idx" ON "CommentTrigger"("brandId");

-- CreateIndex
CREATE INDEX "UncoveredTopic_brandId_status_idx" ON "UncoveredTopic"("brandId", "status");

-- CreateIndex
CREATE INDEX "CustomerProfile_brandId_idx" ON "CustomerProfile"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_brandId_contactPlatformId_key" ON "CustomerProfile"("brandId", "contactPlatformId");

-- CreateIndex
CREATE INDEX "MediaLibrary_brandId_idx" ON "MediaLibrary"("brandId");

-- CreateIndex
CREATE INDEX "TestCase_brandId_idx" ON "TestCase"("brandId");

-- CreateIndex
CREATE INDEX "TestRun_brandId_idx" ON "TestRun"("brandId");

-- CreateIndex
CREATE INDEX "TestRunResult_testRunId_idx" ON "TestRunResult"("testRunId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMember" ADD CONSTRAINT "BrandMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMember" ADD CONSTRAINT "BrandMember_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAccount" ADD CONSTRAINT "PlatformAccount_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookSection" ADD CONSTRAINT "NotebookSection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookVersion" ADD CONSTRAINT "NotebookVersion_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookConfig" ADD CONSTRAINT "NotebookConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplySettings" ADD CONSTRAINT "ReplySettings_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTrigger" ADD CONSTRAINT "CommentTrigger_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTrigger" ADD CONSTRAINT "CommentTrigger_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UncoveredTopic" ADD CONSTRAINT "UncoveredTopic_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLibrary" ADD CONSTRAINT "MediaLibrary_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
