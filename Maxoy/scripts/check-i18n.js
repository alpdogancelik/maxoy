const path = require("path");
const { pathToFileURL } = require("url");

const flattenKeys = (obj, prefix = "") => {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value, next);
    }
    return [next];
  });
};

const diffKeys = (base, compare) => {
  const baseSet = new Set(base);
  return compare.filter((key) => !baseSet.has(key));
};

const run = async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, "..", "constants", "i18n.js")
  );
  const { TRANSLATIONS } = await import(moduleUrl);

  const languages = Object.keys(TRANSLATIONS || {});
  if (languages.length < 2) {
    console.log("Not enough languages to compare.");
    return;
  }

  const keyMap = {};
  for (const lang of languages) {
    keyMap[lang] = flattenKeys(TRANSLATIONS[lang]);
  }

  const baseLang = languages[0];
  const baseKeys = keyMap[baseLang];
  let hasDiffs = false;

  for (const lang of languages.slice(1)) {
    const missing = diffKeys(keyMap[lang], baseKeys);
    const extra = diffKeys(baseKeys, keyMap[lang]);
    if (missing.length || extra.length) {
      hasDiffs = true;
      console.log(`\n${lang.toUpperCase()} comparison vs ${baseLang.toUpperCase()}`);
      if (missing.length) {
        console.log(`Missing keys (${missing.length}):`);
        missing.forEach((key) => console.log(`  - ${key}`));
      }
      if (extra.length) {
        console.log(`Extra keys (${extra.length}):`);
        extra.forEach((key) => console.log(`  - ${key}`));
      }
    }
  }

  if (hasDiffs) {
    process.exit(1);
  }

  console.log("i18n check passed. All translation keys match.");
};

run().catch((err) => {
  console.error("i18n check failed:", err);
  process.exit(1);
});
