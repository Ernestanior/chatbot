"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ChatBotAI</CardTitle>
          <CardDescription>AI 社群客服自动化平台</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
          >
            使用 Facebook 登入
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            登入即表示您同意我们的服务条款与隐私政策
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
