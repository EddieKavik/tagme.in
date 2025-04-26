// scriptWorker.js - Web Worker for run-safe script execution
self.onmessage = function(e) {
  const { scriptId, code, timeout = 3000, messages = [] } = e.data;
  let timedOut = false;
  let result = null;
  let error = null;
  
  // Setup timeout
  const timeoutId = setTimeout(() => {
    timedOut = true;
    self.postMessage({
      id: scriptId,
      status: 'timeout',
      message: 'Script execution exceeded the 3 second timeout and was paused.'
    });
  }, timeout);
  
  try {
    // Create safe evaluation environment
    const safeEval = new Function('code', 'messages', `
      try {
        // Create sandbox environment with limited access to globals
        const sandboxGlobals = {
          console: { 
            log: function(...args) { 
              self.postMessage({
                id: '${scriptId}',
                type: 'log',
                data: args
              });
            },
            error: function(...args) {
              self.postMessage({
                id: '${scriptId}',
                type: 'error',
                data: args
              });
            },
            warn: function(...args) {
              self.postMessage({
                id: '${scriptId}',
                type: 'warn',
                data: args
              });
            }
          },
          setTimeout: function(fn, delay) {
            const id = setTimeout(() => {
              if (!timedOut) fn();
            }, delay);
            return id;
          },
          clearTimeout: clearTimeout,
          postMessage: function(data) {
            self.postMessage({
              id: '${scriptId}',
              type: 'userMessage',
              data: data
            });
          },
          // Add safe JSON methods
          JSON: {
            parse: JSON.parse,
            stringify: JSON.stringify
          },
          // Add safe array/string methods
          Array: {
            isArray: Array.isArray
          },
          // Math operations
          Math: Math,
          // Date constructor (safe)
          Date: Date,
          // Regular expressions (safe)
          RegExp: RegExp,
          // Type checking
          Number: Number,
          String: String,
          Boolean: Boolean,
          // Handle errors
          Error: Error,
          // Provide messages to the function
          messages: ${JSON.stringify(messages)}
        };
        
        // Parse the code to check for function
        let funcToExecute;
        if (code.includes('function processMessages')) {
          // Extract processMessages function
          funcToExecute = new Function(...Object.keys(sandboxGlobals), 
            \`
              ${code}
              return processMessages(messages);
            \`
          );
        } else {
          // Use the whole code as a function body
          funcToExecute = new Function(...Object.keys(sandboxGlobals), 
            \`
              ${code}
              return { success: true, message: "Script executed but no explicit return value" };
            \`
          );
        }
        
        // Execute the script with the sandboxed globals
        const result = funcToExecute(...Object.values(sandboxGlobals));
        return { success: true, result: result };
      } catch (err) {
        console.error('Script execution error:', err);
        return { success: false, error: err.message || 'Unknown error' };
      }
    `);
    
    // Run the evaluation with messages
    result = safeEval(code, messages);
    
    if (!timedOut) {
      // Process results
      if (result.success) {
        // Format and display results
        self.postMessage({
          id: scriptId,
          status: 'completed',
          message: 'Script executed successfully',
          result: result.result,
          success: true
        });
        
        // If result contains filtered messages, send them separately
        if (result.result && result.result.filteredMessages) {
          self.postMessage({
            id: scriptId,
            type: 'filteredMessages',
            data: result.result.filteredMessages
          });
        }
        
        // If result contains a summary, send it as a log message
        if (result.result && result.result.summary) {
          self.postMessage({
            id: scriptId,
            type: 'log',
            data: [result.result.summary]
          });
        }
      } else {
        self.postMessage({
          id: scriptId,
          status: 'error',
          message: \`Error: ${result.error}\`,
          error: result.error
        });
      }
    }
  } catch (err) {
    error = err;
    if (!timedOut) {
      self.postMessage({
        id: scriptId,
        status: 'error',
        message: \`Worker error: ${err.message || 'Unknown error'}\`,
        error: err.message || 'Unknown error'
      });
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

// Handle worker termination
self.addEventListener('close', function() {
  self.postMessage({
    status: 'terminated',
    message: 'Worker was terminated'
  });
}); 