// File: settings.js
const API_BASE_URL = CONFIG.API_BASE_URL;

document.addEventListener('DOMContentLoaded', async () => {
    const token = await tokenManager.get('haks-token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    initializeSettingsPage(token);
});

function initializeSettingsPage(token) {
    fetchUserInfo(token);
    fetchWorkspaceMembers(token);
    setupEventListeners(token);
}

function setupEventListeners(token) {
    document.getElementById('logout-button').addEventListener('click', async () => {
        await tokenManager.remove('haks-token');
        window.location.href = 'login.html';
    });
    const inviteForm = document.getElementById('invite-form');
    inviteForm.addEventListener('submit', (event) => handleInviteSubmit(event, token));
}

async function fetchUserInfo(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/user`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Could not fetch user info.');
        const user = await response.json();
        document.getElementById('user-email').textContent = user.email;
        document.querySelector('.user-avatar').textContent = user.email.charAt(0).toUpperCase();
    } catch (error) {
        await tokenManager.remove('haks-token');
        window.location.href = 'login.html';
    }
}

async function fetchWorkspaceMembers(token) {
    const listContainer = document.getElementById('member-list-container');
    listContainer.innerHTML = `<div id="member-list-placeholder" class="placeholder-text">Loading members...</div>`;
    try {
        const response = await fetch(`${API_BASE_URL}/workspace/members`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch members.');
        }
        const members = await response.json();
        renderMemberList(members, token);
    } catch (error) {
        listContainer.innerHTML = `<div class="placeholder-text">Error: ${error.message}</div>`;
    }
}

async function removeMember(memberId, token) {
    if (!confirm('Are you sure you want to remove this member?')) { return; }
    try {
        const response = await fetch(`${API_BASE_URL}/workspace/members/${memberId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to remove member.'); }
        await fetchWorkspaceMembers(token); // Refresh the list
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

function renderMemberList(members, token) {
    const listContainer = document.getElementById('member-list-container');
    listContainer.innerHTML = '';
    if (members.length === 0) { listContainer.innerHTML = `<div class="placeholder-text">No members found.</div>`; return; }
    members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'member-item';
        const isOwner = member.role === 'owner';
        memberElement.innerHTML = `<div class="member-info"><span class="member-name">${member.full_name || member.email}</span><span class="member-role ${isOwner ? 'owner' : ''}">${member.role}</span></div> ${!isOwner ? '<button class="remove-btn">Remove</button>' : ''}`;
        if (!isOwner) {
            memberElement.querySelector('.remove-btn').addEventListener('click', () => removeMember(member.id, token));
        }
        listContainer.appendChild(memberElement);
    });
}

async function handleInviteSubmit(event, token) {
    event.preventDefault();
    const inviteButton = document.getElementById('invite-button');
    const inviteeEmailInput = document.getElementById('invitee-email');
    const feedback = document.getElementById('invite-feedback');
    inviteButton.disabled = true;
    inviteButton.textContent = 'Sending...';
    feedback.classList.add('hidden');
    feedback.textContent = '';
    try {
        const response = await fetch(`${API_BASE_URL}/workspace/invites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ invitee_email: inviteeEmailInput.value })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send invite.');
        const inviteLink = `${window.location.origin}/accept-invite.html?token=${data.invite.token}`;
        feedback.innerHTML = `Success! Share this link: <br><input type="text" readonly value="${inviteLink}" onclick="this.select()" class="feedback-input">`;
        feedback.className = 'feedback-message success';
        feedback.classList.remove('hidden');
        inviteeEmailInput.value = '';
    } catch (error) {
        feedback.textContent = `Error: ${error.message}`;
        feedback.className = 'feedback-message error';
        feedback.classList.remove('hidden');
    } finally {
        inviteButton.disabled = false;
        inviteButton.textContent = 'Send Invitation';
    }
}