import type { Brand } from "../types/brand";
import { marketviewBrand } from "./marketview";

export const BRANDS: Record<string, Brand> = {
  marketview: marketviewBrand,
};

export const getBrand = (id: string): Brand => {
  const b = BRANDS[id];
  if (!b) {
    throw new Error(`Unknown brand "${id}". Registered: ${Object.keys(BRANDS).join(", ")}.`);
  }
  return b;
};
