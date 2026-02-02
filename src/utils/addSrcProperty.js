// src/utils/addSrcProperty.js
export const addSrcProperty = (obj) => {
  if (obj && typeof obj === 'object') {
    // Add src property
    if (!obj.hasOwnProperty('src')) {
      Object.defineProperty(obj, 'src', {
        value: null,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    
    // Recursively add to all properties
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value && typeof value === 'object') {
        addSrcProperty(value);
      } else if (typeof value === 'function') {
        // Add src to functions too
        if (!value.hasOwnProperty('src')) {
          Object.defineProperty(value, 'src', {
            value: null,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    });
  }
  return obj;
};

export default addSrcProperty;
