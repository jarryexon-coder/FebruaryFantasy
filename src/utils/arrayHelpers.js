// src/utils/arrayHelpers.js - Safe array operations
export const safeSlice = (data, start = 0, end) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    const sliceEnd = end !== undefined ? end : data.length;
    return data.slice(start, sliceEnd);
  }
  if (typeof data === 'object' && data !== null) {
    try {
      const arr = Object.values(data);
      const sliceEnd = end !== undefined ? end : arr.length;
      return arr.slice(start, sliceEnd);
    } catch {
      return [];
    }
  }
  return [];
};

export const ensureArray = (data) => {
  return safeSlice(data, 0); // Returns full array or empty array
};

export const safeMap = (data, callback) => {
  const arr = ensureArray(data);
  return arr.map(callback);
};

export const safeFilter = (data, callback) => {
  const arr = ensureArray(data);
  return arr.filter(callback);
};

export const safeFind = (data, callback) => {
  const arr = ensureArray(data);
  return arr.find(callback);
};
