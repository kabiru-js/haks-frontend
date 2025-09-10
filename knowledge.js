// File: knowledge.js
// FINAL, COMPLETE, AND CORRECTED VERSION

const API_BASE_URL = 'http://localhost:5000/api';

// --- State Variables ---
let currentSearchTerm = '';
let currentSourceType = null;
let debounceTimer;

// --- Main execution starts here ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = await tokenManager.get('haks-token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    initializeKnowledgeHub(token);
});

// --- Initialization and Event Setup ---
function initializeKnowledgeHub(token) {
    fetchUserInfo(token);
    fetchKnowledgeSources(token);
    setupEventListeners(token);
}

function setupEventListeners(token) {
    document.getElementById('logout-button').addEventListener('click', async () => {
        await tokenManager.remove('haks-token');
        window.location.href = 'login.html';
    });
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchKnowledgeSources(token), 300);
    });
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const source = button.dataset.source;
            if (currentSourceType === source) {
                currentSourceType = null;
                button.classList.remove('active');
            } else {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentSourceType = source;
            }
            fetchKnowledgeSources(token);
        });
    });
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        currentSearchTerm = '';
        currentSourceType = null;
        searchInput.value = '';
        filterButtons.forEach(btn => btn.classList.remove('active'));
        fetchKnowledgeSources(token);
    });
}

function updateClearButtonVisibility() {
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (currentSearchTerm || currentSourceType) {
        clearFiltersBtn.classList.remove('hidden');
    } else {
        clearFiltersBtn.classList.add('hidden');
    }
}

// --- API Call Functions ---
async function fetchUserInfo(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/user`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!response.ok) throw new Error('Could not fetch user info.');
        const user = await response.json();
        document.getElementById('user-email').textContent = user.email;
        document.querySelector('.user-avatar').textContent = user.email.charAt(0).toUpperCase();
    } catch (error) {
        await tokenManager.remove('haks-token');
        window.location.href = 'login.html';
    }
}

async function fetchKnowledgeSources(token) {
    if (!token) { window.location.href = 'login.html'; return; }
    
    const listContainer = document.getElementById('knowledge-list-container');
    listContainer.innerHTML = `<div id="knowledge-list-placeholder" class="placeholder-text">Loading knowledge...</div>`;
    updateClearButtonVisibility();

    const params = new URLSearchParams();
    if (currentSearchTerm) params.append('search', currentSearchTerm);
    if (currentSourceType) params.append('source_type', currentSourceType);

    try {
        const response = await fetch(`${API_BASE_URL}/knowledge?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to fetch knowledge.'); }
        const items = await response.json();
        renderKnowledgeList(items);
    } catch (error) {
        listContainer.innerHTML = `<div id="knowledge-list-placeholder" class="placeholder-text">Error: ${error.message}</div>`;
    }
}

// --- UI Rendering ---

// --- THIS FUNCTION WAS MISSING ---
function getIconForSource(sourceType) {
    const icons = { slack: '💬', email: '✉️', gdoc: '📄', transcript: '🎙️', manual: '✏️', default: '✏️' };
    return icons[sourceType] || icons.default;
}
// --------------------------------

function renderKnowledgeList(items) {
    const listContainer = document.getElementById('knowledge-list-container');
    listContainer.innerHTML = ''; 
    if (!items || !Array.isArray(items) || items.length === 0) {
        listContainer.innerHTML = `<div id="knowledge-list-placeholder" class="placeholder-text">No knowledge sources found.</div>`;
        return;
    }
    items.forEach(item => {
        if (!item || !item.source_type || !item.content) { return; } // Skip malformed items
        const itemElement = document.createElement('div');
        itemElement.className = 'knowledge-item';
        const displayDate = new Date(item.source_created_at || item.created_at).toLocaleDateString();
        const title = (item.source_metadata && item.source_metadata.title) ? item.source_metadata.title : item.source_type;
        const icon = getIconForSource(item.source_type);
        const summary = item.summary || item.content.substring(0, 150) + (item.content.length > 150 ? '...' : '');
        let footerHTML = '';
        if (item.ai_analysis && Array.isArray(item.ai_analysis.autoTags)) {
            const tagsHTML = item.ai_analysis.autoTags.map(tag => `<span class="tag">${tag}</span>`).join('');
            const actionItems = item.ai_analysis.actionItems;
            const actionCount = Array.isArray(actionItems) ? actionItems.length : 0;
            const actionHTML = actionCount > 0 ? `<div class="item-action-count">📋 ${actionCount} Action Item${actionCount > 1 ? 's' : ''}</div>` : '';
            if (tagsHTML || actionHTML) { footerHTML = `<div class="item-footer"><div class="item-tags">${tagsHTML}</div>${actionHTML}</div>`; }
        }
        itemElement.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-content">
                <div class="item-header"><span class="item-title">${title}</span><span class="item-date">${displayDate}</span></div>
                <p class="item-summary">${summary}</p>
                ${item.source_url ? `<a href="${item.source_url}" target="_blank" class="item-link">View Original</a>` : ''}
                ${footerHTML}
            </div>
        `;
        listContainer.appendChild(itemElement);
    });
}