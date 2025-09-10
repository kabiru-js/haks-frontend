// File: accept-invite.js
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    const loggedInToken = await tokenManager.get('haks-token');
    
    const title = document.getElementById('card-title');
    const message = document.getElementById('card-message');
    const actionButton = document.getElementById('action-button');
    const loginLink = document.getElementById('login-link-container');

    if (!inviteToken) {
        title.textContent = 'Invalid Link';
        message.textContent = 'No invitation token was found in the URL.';
        return;
    }

    if (!loggedInToken) {
        await tokenManager.set('pending-invite-token', inviteToken);
        title.textContent = 'Please Log In';
        message.textContent = 'To accept this invitation, you must first log in or create an account.';
        loginLink.classList.remove('hidden');
        return;
    }
    
    title.textContent = 'Join Workspace';
    message.textContent = 'You have been invited to join a Haks AI workspace.';
    actionButton.classList.remove('hidden');

    actionButton.addEventListener('click', async () => {
        actionButton.disabled = true;
        actionButton.textContent = 'Joining...';
        try {
            const response = await fetch(`${API_BASE_URL}/workspace/invites/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loggedInToken}` },
                body: JSON.stringify({ token: inviteToken })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            alert('Successfully joined the workspace!');
            await tokenManager.remove('pending-invite-token'); // Clean up
            window.location.href = 'dashboard.html';

        } catch (error) {
            message.textContent = `Error: ${error.message}`;
            message.style.color = 'red';
            actionButton.disabled = false;
            actionButton.textContent = 'Accept Invitation';
        }
    });
});