// API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2015';

// App name
export const APP_NAME = 'HyperTrade Admin';

// Default pagination
export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

// Date format options
export const DATE_FORMAT_OPTIONS = {
  full: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  date: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
};
