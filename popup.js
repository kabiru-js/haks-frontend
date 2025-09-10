// File: popup.js
document.addEventListener('DOMContentLoaded', async () => {
    // We need to reference token-manager.js, which is loaded before this script.
    const token = await tokenManager.get('haks-token');
    if (token) {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'login.html';
    }
});