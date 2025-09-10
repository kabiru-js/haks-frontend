// File: signup.js
const API_BASE_URL = CONFIG.API_BASE_URL;
const signupForm = document.getElementById('signup-form');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submit-button');
const errorMessage = document.getElementById('error-message');

signupForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';
    errorMessage.textContent = '';
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullNameInput.value, email: emailInput.value, password: passwordInput.value }),
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.error); }

        await tokenManager.set('haks-token', data.session.access_token);
        
        const pendingToken = await tokenManager.get('pending-invite-token');
        if (pendingToken) {
            await tokenManager.remove('pending-invite-token');
            window.location.href = `accept-invite.html?token=${pendingToken}`;
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
});