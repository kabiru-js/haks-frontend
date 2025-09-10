// File: dashboard.js
const API_BASE_URL = CONFIG.API_BASE_URL;
let currentTranscriptId = null; 

document.addEventListener('DOMContentLoaded', async () => {
    const token = await tokenManager.get('haks-token');
    if (!token) { window.location.href = 'login.html'; return; }
    initializeDashboard(token);
});

function initializeDashboard(token) {
    fetchUserInfo(token);
    setupEventListeners(token);
}

function setupEventListeners(token) {
    document.getElementById('logout-button').addEventListener('click', async () => {
        await tokenManager.remove('haks-token');
        window.location.href = 'login.html';
    });
    document.getElementById('upload-form').addEventListener('submit', (event) => handleUploadSubmit(event, token));
    document.getElementById('qa-form').addEventListener('submit', (event) => handleQASubmit(event, token));
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

async function handleUploadSubmit(event, token) {
    event.preventDefault();
    const uploadButton = document.getElementById('upload-button');
    const uploadError = document.getElementById('upload-error');
    const fileInput = document.getElementById('transcript-file');
    const resultsSection = document.getElementById('results-section');
    const file = fileInput.files[0];
    if (!file) { uploadError.textContent = 'Please select a file.'; return; }

    uploadButton.disabled = true;
    uploadButton.textContent = 'Processing...';
    uploadError.textContent = '';
    resultsSection.classList.add('hidden');
    try {
        const content = await file.text();
        const response = await fetch(`${API_BASE_URL}/knowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                source_type: 'transcript',
                content: content,
                source_metadata: { title: file.name },
                source_created_at: new Date(file.lastModified).toISOString()
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed.');
        currentTranscriptId = data.knowledge.id;
        const summaryDisplay = document.getElementById('summary-display');
        const summary = data.knowledge.ai_analysis?.summary || data.knowledge.summary || 'No summary available.';
        summaryDisplay.innerHTML = `<h3>Summary for: ${data.knowledge.source_metadata.title}</h3><p>${summary.replace(/\n/g, '<br>')}</p>`;
        resultsSection.classList.remove('hidden');
    } catch (error) {
        uploadError.textContent = error.message;
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Generate Summary';
    }
}

async function handleQASubmit(event, token) {
    event.preventDefault();
    if (!currentTranscriptId) return;
    const qaButton = document.getElementById('qa-button');
    const qaQuestionInput = document.getElementById('qa-question');
    const qaAnswerBox = document.getElementById('qa-answer');
    qaButton.disabled = true;
    qaButton.textContent = 'Thinking...';
    qaAnswerBox.textContent = '';
    try {
        const response = await fetch(`${API_BASE_URL}/transcripts/${currentTranscriptId}/query`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ question: qaQuestionInput.value }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not get an answer.');
        qaAnswerBox.textContent = data.answer;
    } catch (error) {
        qaAnswerBox.textContent = `Error: ${error.message}`;
    } finally {
        qaButton.disabled = false;
        qaButton.textContent = 'Ask';
    }
}