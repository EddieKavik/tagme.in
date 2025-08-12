// Standalone Realm Tabs Copy Script
// Paste this entire script into any browser console to copy realm tabs

(function() {
  'use strict';
  
  // Function to read from localStorage/sessionStorage
  function read(key, defaultValue) {
    // Try sessionStorage first, then fall back to localStorage
    let data = sessionStorage.getItem(key);
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    
    data = localStorage.getItem(key);
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    
    return defaultValue;
  }
  
  // Function to get all realm sessions
  function getRealmSessions() {
    try {
      const sessions = read('tmi:sessions', []);
      return sessions;
    } catch (error) {
      console.error('Error getting realm sessions:', error);
      return [];
    }
  }
  
  // Function to generate JavaScript code for realm tabs
  function generateRealmTabsCode() {
    const sessions = getRealmSessions();
    
    if (sessions.length === 0) {
      return '// No realm sessions found';
    }
    
    let code = '// Realm Tabs JavaScript Code\n';
    code += '// Generated on: ' + new Date().toISOString() + '\n\n';
    
    code += 'const realmSessions = [\n';
    
    sessions.forEach((session, index) => {
      code += '  {\n';
      code += `    id: '${session.id || ''}',\n`;
      code += `    url: '${session.url || ''}',\n`;
      code += `    name: '${session.name || ''}',\n`;
      code += `    email: '${session.email || ''}',\n`;
      code += `    realm: '${session.realm || ''}',\n`;
      code += `    createdAt: '${session.createdAt || ''}',\n`;
      code += `    lastUsed: '${session.lastUsed || ''}'\n`;
      code += '  }';
      
      if (index < sessions.length - 1) {
        code += ',';
      }
      code += '\n';
    });
    
    code += '];\n\n';
    
    // Add helper functions
    code += '// Helper function to create realm tabs\n';
    code += 'function createRealmTabs() {\n';
    code += '  const container = document.createElement(\'div\');\n';
    code += '  container.className = \'realm-tabs-container\';\n\n';
    
    code += '  realmSessions.forEach(session => {\n';
    code += '    const tab = document.createElement(\'div\');\n';
    code += '    tab.className = \'realm-tab\';\n';
    code += '    tab.textContent = session.name || session.url;\n';
    code += '    tab.title = session.url;\n';
    code += '    tab.onclick = () => {\n';
    code += '      console.log(\'Switching to realm:\', session);\n';
    code += '      // Add your realm switching logic here\n';
    code += '    };\n';
    code += '    container.appendChild(tab);\n';
    code += '  });\n\n';
    
    code += '  return container;\n';
    code += '}\n\n';
    
    code += '// Helper function to restore sessions to storage\n';
    code += 'function restoreRealmSessions() {\n';
    code += '  try {\n';
    code += '    localStorage.setItem(\'tmi:sessions\', JSON.stringify(realmSessions));\n';
    code += '    sessionStorage.setItem(\'tmi:sessions\', JSON.stringify(realmSessions));\n';
    code += '    console.log(\'Realm sessions restored successfully\');\n';
    code += '  } catch (error) {\n';
    code += '    console.error(\'Error restoring realm sessions:\', error);\n';
    code += '  }\n';
    code += '}\n\n';
    
    code += '// Usage:\n';
    code += '// 1. createRealmTabs() - Creates DOM elements for realm tabs\n';
    code += '// 2. restoreRealmSessions() - Restores sessions to storage\n';
    code += '// 3. realmSessions - Array of all realm session data\n';
    
    return code;
  }
  
  // Function to copy to clipboard
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('✅ Realm tabs code copied to clipboard!');
        console.log('Generated code:');
        console.log(text);
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        console.log('Generated code (copy manually):');
        console.log(text);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        console.log('✅ Realm tabs code copied to clipboard!');
        console.log('Generated code:');
        console.log(text);
      } catch (error) {
        console.error('Fallback copy failed:', error);
        console.log('Generated code (copy manually):');
        console.log(text);
      }
      
      document.body.removeChild(textArea);
    }
  }
  
  // Main execution
  console.log('🔍 Scanning for realm sessions...');
  const sessions = getRealmSessions();
  
  if (sessions.length === 0) {
    console.log('❌ No realm sessions found in storage');
    console.log('Make sure you are on a Tag Me In page with active sessions');
  } else {
    console.log(`✅ Found ${sessions.length} realm session(s):`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.name || session.url} (${session.id})`);
    });
    
    const code = generateRealmTabsCode();
    copyToClipboard(code);
  }
  
  // Make functions available globally
  window.getRealmSessions = getRealmSessions;
  window.generateRealmTabsCode = generateRealmTabsCode;
  window.copyRealmTabsCode = () => copyToClipboard(generateRealmTabsCode());
  
  console.log('\n📋 Available functions:');
  console.log('- getRealmSessions() - Get all realm sessions');
  console.log('- generateRealmTabsCode() - Generate JavaScript code');
  console.log('- copyRealmTabsCode() - Copy code to clipboard');
  
})();
