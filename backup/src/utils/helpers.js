// src/utils/helpers.js

// Safe string functions
export const safeUpperCase = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.toUpperCase();
};

export const safeString = (str, fallback = '') => {
  return str || fallback;
};

// Safe array access
export const safeArray = (arr) => {
  return Array.isArray(arr) ? arr : [];
};

// Safe object access
export const safeObject = (obj) => {
  return obj && typeof obj === 'object' ? obj : {};
};

// Format team name
export const formatTeamName = (team) => {
  if (!team) return '';
  
  const name = typeof team === 'string' ? team : team.name || team.team || '';
  return safeUpperCase(name);
};
