// File: token-manager.js
const tokenManager = {
    isExtension: () => window.chrome && chrome.runtime && chrome.runtime.id,

    set: (key, value) => {
        return new Promise((resolve) => {
            if (tokenManager.isExtension()) {
                chrome.storage.local.set({ [key]: value }, resolve);
            } else {
                localStorage.setItem(key, value);
                resolve();
            }
        });
    },

    get: (key) => {
        return new Promise((resolve) => {
            if (tokenManager.isExtension()) {
                chrome.storage.local.get([key], (result) => resolve(result[key] || null));
            } else {
                resolve(localStorage.getItem(key));
            }
        });
    },

    remove: (key) => {
        return new Promise((resolve) => {
            if (tokenManager.isExtension()) {
                chrome.storage.local.remove(key, resolve);
            } else {
                localStorage.removeItem(key);
                resolve();
            }
        });
    }
};