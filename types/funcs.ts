export const formatNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }

  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }

  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }

  return value.toString();
};

export const isObjectComplete = (
  obj: Record<string, unknown>,
  excludeKeys: string[] = [],
): boolean => {
  return Object.entries(obj).every(([key, value]) => {
    if (excludeKeys.includes(key)) return true;

    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") return value.trim() !== "";
    return value !== null && value !== undefined;
  });
};
