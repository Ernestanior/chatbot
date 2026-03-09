"use client";

import { useState } from "react";
import { useBrand } from "@/components/brand-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HelpTip } from "@/components/help-tip";
import { toast } from "sonner";

export default function BrandsPage() {
  const { brands, currentBrand, setCurrentBrand, refreshBrands } = useBrand();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const brand = await res.json();
        await refreshBrands();
        setCurrentBrand(brand);
        setName("");
        setOpen(false);
        toast.success("品牌建立成功");
      } else {
        toast.error("建立失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">品牌管理</h1>
          <HelpTip pageKey="brands" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>新增品牌</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立新品牌</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="brand-name">品牌名称</Label>
                <Input
                  id="brand-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：小美牛肉面"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={loading || !name.trim()} className="w-full">
                {loading ? "建立中..." : "建立品牌"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            您还没有建立任何品牌，点击上方「新增品牌」开始
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className={`cursor-pointer transition-colors hover:border-primary ${
                currentBrand?.id === brand.id ? "border-primary" : ""
              }`}
              onClick={() => setCurrentBrand(brand)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{brand.name}</CardTitle>
                  {currentBrand?.id === brand.id && (
                    <Badge variant="secondary">当前</Badge>
                  )}
                </div>
                <CardDescription>ID: {brand.id}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
