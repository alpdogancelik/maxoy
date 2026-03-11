const STOREFRONT_DB_TIMEOUT_MS = Number(process.env.STOREFRONT_DB_TIMEOUT_MS || 15000);

export async function withStorefrontDbTimeout<T>(
  promise: Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Storefront DB query timed out after ${STOREFRONT_DB_TIMEOUT_MS}ms`));
        }, STOREFRONT_DB_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return await fallback();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
