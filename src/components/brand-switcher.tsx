"use client";

import { useBrand } from "@/components/brand-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BrandSwitcher() {
  const { brands, currentBrand, setCurrentBrand } = useBrand();

  if (brands.length === 0) {
    return (
      <div className="px-3 text-sm text-muted-foreground">
        尚未建立品牌
      </div>
    );
  }

  return (
    <Select
      value={currentBrand?.id ?? ""}
      onValueChange={(id) => {
        const brand = brands.find((b) => b.id === id);
        if (brand) setCurrentBrand(brand);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择品牌" />
      </SelectTrigger>
      <SelectContent>
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
