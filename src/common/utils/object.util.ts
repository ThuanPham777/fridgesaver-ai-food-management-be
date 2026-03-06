// src/common/utils/object.util.ts
// Object manipulation utilities

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if an object is empty
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * Remove null and undefined values from an object
 */
export function removeNullish<T extends Record<string, any>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value;
    }
  });
  return result;
}

/**
 * Flatten a nested object
 */
export function flatten(
  obj: Record<string, any>,
  prefix = '',
  separator = '.',
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;
    const value = obj[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey, separator));
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

/**
 * Group an array of objects by a key
 */
export function groupBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Convert object keys to camelCase
 */
export function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamel(item)) as unknown as T;
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      result[camelKey] = keysToCamel(obj[key]);
      return result;
    }, {} as any) as T;
  }

  return obj;
}

/**
 * Convert object keys to snake_case
 */
export function keysToSnake<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnake(item)) as unknown as T;
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      result[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {} as any) as T;
  }

  return obj;
}
