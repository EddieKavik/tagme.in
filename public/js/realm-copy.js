// Realm Tab List Copy Feature
// This script provides functionality to copy realm tabs as JavaScript code

// Function to get all realm sessions
function getRealmSessions() {
  // Try to get sessions from the app's storage
  try {
    // Access the app's session storage functions if available
    if (typeof listSessions === 'function') {
      return listSessions()
    }
    
    // Fallback: try to read from localStorage/sessionStorage
    const sessions = read('tmi:sessions', [])
    return sessions
  } catch (error) {
    console.error('Error getting realm sessions:', error)
    return []
  }
}

// Function to generate JavaScript code for realm tabs
function generateRealmTabsCode() {
  const sessions = getRealmSessions()
  
  if (sessions.length === 0) {
    return '// No realm sessions found'
  }
  
  let code = '// Realm Tabs JavaScript Code\n'
  code += '// Generated on: ' + new Date().toISOString() + '\n\n'
  
  code += 'const realmSessions = [\n'
  
  sessions.forEach((session, index) => {
    code += '  {\n'
    code += `    id: '${session.id || ''}',\n`
    code += `    url: '${session.url || ''}',\n`
    code += `    name: '${session.name || ''}',\n`
    code += `    email: '${session.email || ''}',\n`
    code += `    realm: '${session.realm || ''}',\n`
    code += `    createdAt: '${session.createdAt || ''}',\n`
    code += `    lastUsed: '${session.lastUsed || ''}'\n`
    code += '  }'
    
    if (index < sessions.length - 1) {
      code += ','
    }
    code += '\n'
  })
  
  code += ']\n\n'
  
  // Add helper functions
  code += '// Helper function to create realm tabs\n'
  code += 'function createRealmTabs() {\n'
  code += '  const container = document.createElement(\'div\')\n'
  code += '  container.className = \'realm-tabs-container\'\n\n'
  
  code += '  realmSessions.forEach(session => {\n'
  code += '    const tab = document.createElement(\'div\')\n'
  code += '    tab.className = \'realm-tab\'\n'
  code += '    tab.textContent = session.name || session.url\n'
  code += '    tab.title = session.url\n'
  code += '    tab.onclick = () => {\n'
  code += '      console.log(\'Switching to realm:\', session)\n'
  code += '      // Add your realm switching logic here\n'
  code += '    }\n'
  code += '    container.appendChild(tab)\n'
  code += '  })\n\n'
  
  code += '  return container\n'
  code += '}\n\n'
  
  code += '// Helper function to restore sessions to storage\n'
  code += 'function restoreRealmSessions() {\n'
  code += '  try {\n'
  code += '    // Try to use the app\'s storage functions if available\n'
  code += '    if (typeof writeSessions === \'function\') {\n'
  code += '      writeSessions(realmSessions)\n'
  code += '      console.log(\'Realm sessions restored successfully\')\n'
  code += '    } else {\n'
  code += '      // Fallback to localStorage\n'
  code += '      localStorage.setItem(\'tmi:sessions\', JSON.stringify(realmSessions))\n'
  code += '      console.log(\'Realm sessions saved to localStorage\')\n'
  code += '    }\n'
  code += '  } catch (error) {\n'
  code += '    console.error(\'Error restoring realm sessions:\', error)\n'
  code += '  }\n'
  code += '}\n\n'
  
  code += '// Usage:\n'
  code += '// 1. createRealmTabs() - Creates DOM elements for realm tabs\n'
  code += '// 2. restoreRealmSessions() - Restores sessions to storage\n'
  code += '// 3. realmSessions - Array of all realm session data\n'
  
  return code
}

// Function to copy realm tabs code to clipboard
function copyRealmTabsCode() {
  const code = generateRealmTabsCode()
  
  try {
    // Use modern clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(() => {
        console.log('Realm tabs code copied to clipboard!')
        showCopySuccess()
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err)
        fallbackCopy(code)
      })
    } else {
      // Fallback for older browsers
      fallbackCopy(code)
    }
  } catch (error) {
    console.error('Error copying realm tabs code:', error)
    fallbackCopy(code)
  }
}

// Fallback copy method
function fallbackCopy(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    document.execCommand('copy')
    console.log('Realm tabs code copied to clipboard!')
    showCopySuccess()
  } catch (error) {
    console.error('Fallback copy failed:', error)
    showCopyError()
  }
  
  document.body.removeChild(textArea)
}

// Show success message
function showCopySuccess() {
  const message = document.createElement('div')
  message.textContent = '✅ Realm tabs code copied to clipboard!'
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `
  document.body.appendChild(message)
  
  setTimeout(() => {
    if (message.parentNode) {
      message.parentNode.removeChild(message)
    }
  }, 3000)
}

// Show error message
function showCopyError() {
  const message = document.createElement('div')
  message.textContent = '❌ Failed to copy realm tabs code'
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `
  document.body.appendChild(message)
  
  setTimeout(() => {
    if (message.parentNode) {
      message.parentNode.removeChild(message)
    }
  }, 3000)
}

// Add copy button to realm tabs
function addRealmCopyButton() {
  // Wait for realm tabs to be available
  const checkRealmTabs = setInterval(() => {
    const realmContainer = document.querySelector('.app-accounts')
    if (realmContainer) {
      clearInterval(checkRealmTabs)
      
      // Create copy button
      const copyButton = document.createElement('button')
      copyButton.textContent = '📋 Copy Realms'
      copyButton.title = 'Copy realm tabs as JavaScript code'
      copyButton.style.cssText = `
        margin-left: 10px;
        padding: 4px 8px;
        background: var(--background-secondary, #1a1a1a);
        color: var(--text-primary, #fff);
        border: 1px solid var(--border-color, #333);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      `
      copyButton.addEventListener('click', copyRealmTabsCode)
      
      // Add button to realm container
      realmContainer.appendChild(copyButton)
      
      console.log('Realm copy button added')
    }
  }, 100)
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addRealmCopyButton)
} else {
  addRealmCopyButton()
}

// Export functions for global access
window.copyRealmTabsCode = copyRealmTabsCode
window.generateRealmTabsCode = generateRealmTabsCode
window.getRealmSessions = getRealmSessions
