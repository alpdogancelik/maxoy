export const FILTER_GROUPS = [
  { key: "colorTone", labelKey: "filters.colorTone" },
  { key: "sizeMeasure", labelKey: "filters.sizeMeasure" },
  { key: "material", labelKey: "filters.material" },
  { key: "usage", labelKey: "filters.usage" },
  { key: "brand", labelKey: "filters.brand" },
  { key: "packageContents", labelKey: "filters.packageContents" },
  { key: "tags", labelKey: "filters.tags" },
];

export const CATEGORY_FILTER_PRESETS = {
  A: ["colorTone", "sizeMeasure", "usage", "brand"],
  B: ["colorTone", "sizeMeasure", "usage", "brand"],
  C: ["colorTone", "sizeMeasure", "usage", "packageContents"],
  D: ["colorTone", "sizeMeasure", "material", "brand"],
  E: ["material", "usage", "brand"],
  F: ["colorTone", "sizeMeasure", "material", "usage"],
  G: ["colorTone", "sizeMeasure", "material"],
  H: ["colorTone", "material", "usage"],
  I: ["colorTone", "usage", "tags"],
};
