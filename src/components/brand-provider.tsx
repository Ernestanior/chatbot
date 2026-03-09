"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface Brand {
  id: string;
  name: string;
}

interface BrandContextType {
  brands: Brand[];
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand) => void;
  refreshBrands: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  brands: [],
  currentBrand: null,
  setCurrentBrand: () => {},
  refreshBrands: async () => {},
});

export function useBrand() {
  return useContext(BrandContext);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);

  const refreshBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
        if (data.length > 0 && !currentBrand) {
          setCurrentBrand(data[0]);
        }
      }
    } catch {
      // silently fail
    }
  }, [currentBrand]);

  useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  return (
    <BrandContext.Provider value={{ brands, currentBrand, setCurrentBrand, refreshBrands }}>
      {children}
    </BrandContext.Provider>
  );
}
