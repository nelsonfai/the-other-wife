/** @format */

import path from "node:path";
import fs from "node:fs/promises";
const templateCache = new Map<string, string>();

export const getTemplate = async (
  src: string,
  target: string,
): Promise<string> => {
  const cacheKey = `${src}/${target}`;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const templatePath = path.join(process.cwd(), cacheKey);

  try {
    const template = await fs.readFile(templatePath, "utf-8");
    templateCache.set(cacheKey, template);
    return template;
  } catch (error: any) {
    throw error;
  }
};
