// Web support configuration for React Native Web
// This file helps with web compatibility issues

// Polyfill for AsyncStorage on web
if (typeof window !== 'undefined' && !window.AsyncStorage) {
  window.AsyncStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    clear: () => Promise.resolve(localStorage.clear()),
    getAllKeys: () => Promise.resolve(Object.keys(localStorage)),
  }
}

// Polyfill for window object in Node.js environment
if (typeof window === 'undefined') {
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    }
  }
}

export default {}
