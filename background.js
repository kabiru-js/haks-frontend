// File: background.js (Improved)
const API_BASE_URL = 'http://localhost:5000/api';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveToHaks",
        title: "Save to Haks",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "saveToHaks") {
        const selectedText = info.selectionText;
        const sourceUrl = tab.url;
        const pageTitle = tab.title;

        try {
            const token = await getAuthToken();
            if (!token) {
                console.error("Haks AI: User is not logged in.");
                // Optional: We could create a notification telling the user to log in.
                return;
            }

            const response = await fetch(`${API_BASE_URL}/knowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    source_type: 'manual', // 'manual' is a valid type in our database enum
                    content: selectedText,
                    source_metadata: { title: pageTitle }, // Consistent with other types
                    source_url: sourceUrl,
                    source_created_at: new Date().toISOString() // Add a creation date
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save to Haks.');
            }
            console.log("Successfully saved to Haks:", data);
            
            // --- NEW: Create a success notification ---
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png', // We'll need to create this icon
                title: 'Haks AI',
                message: 'Successfully saved to your Knowledge Hub!'
            });

        } catch (error) {
            console.error("Error saving to Haks:", error);
        }
    }
});

// A helper function to get the token, since chrome.storage is async
function getAuthToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['haks-token'], (result) => {
            resolve(result['haks-token'] || null);
        });
    });
}