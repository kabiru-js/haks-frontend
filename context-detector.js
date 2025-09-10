if (window.chrome && chrome.runtime && chrome.runtime.id) {
  // We are inside a Chrome extension.
  console.log("Haks AI: Running in Chrome extension context.");
  
  // Add the special class to the body tag.
  document.body.classList.add('chrome-extension-popup');
} else {
  // We are on a normal webpage.
  console.log("Haks AI: Running in standard web page context.");
}