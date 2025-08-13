// Filter Bar functionality for Tag Me In
let tagFilter = new Set()
let allTags = new Set()

// Create filter bar element
function createFilterBar() {
  console.log('Creating filter bar...')
  const filterBar = document.createElement('div')
filterBar.className = 'filter-bar'
filterBar.setAttribute('data-tour', 'Use filters to find specific types of content or messages.')

  // Filter icon
  const filterIcon = document.createElement('span')
  filterIcon.innerHTML = '🏷️'
  filterIcon.title = 'Filter by tags'

  // Tags container
  const tagsContainer = document.createElement('div')
  tagsContainer.className = 'tags-container'

  // Clear filters button
  const clearFiltersBtn = document.createElement('button')
  clearFiltersBtn.textContent = 'Clear Filters'
  clearFiltersBtn.className = 'clear-filters-btn'
  clearFiltersBtn.addEventListener('click', () => {
    tagFilter.clear()
    updateFilterBar()
    filterMessagesByTags()
  })

  filterBar.appendChild(filterIcon)
  filterBar.appendChild(tagsContainer)
  filterBar.appendChild(clearFiltersBtn)

  return { filterBar, tagsContainer }
}

// Extract hashtags from text
function extractHashtags(text) {
  if (!text || typeof text !== 'string') return []
  
  const hashtagRegex = /#([^,\s]+)/g
  const tags = []
  let match
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    const tag = match[1].toLowerCase().trim()
    if (tag.length > 0) {
      tags.push(tag)
    }
  }
  
  return tags
}

// Extract all tags from visible messages
function extractAllTags() {
  const messages = document.querySelectorAll('.text-message, .news, .reaction-message, .label-message')
  const tags = new Set()
  
  console.log('Extracting tags from', messages.length, 'messages')
  
  messages.forEach(message => {
    const messageText = message.textContent || message.innerText || ''
    const messageTags = extractHashtags(messageText)
    messageTags.forEach(tag => tags.add(tag))
  })
  
  console.log('Found tags:', Array.from(tags))
  return tags
}

// Update filter bar with current tags
function updateFilterBar() {
  const tagsContainer = document.querySelector('.tags-container')
  if (!tagsContainer) return
  
  // Clear existing tags
  tagsContainer.innerHTML = ''
  
  // Get all tags from visible messages
  allTags = extractAllTags()
  
  if (allTags.size === 0) {
    // No tags found, show a message
    const noTagsMsg = document.createElement('span')
    noTagsMsg.textContent = 'No tags found in messages'
    noTagsMsg.style.color = 'var(--text-secondary, #888)'
    noTagsMsg.style.fontSize = '12px'
    noTagsMsg.style.fontStyle = 'italic'
    tagsContainer.appendChild(noTagsMsg)
  } else {
    // Create tag buttons
    allTags.forEach(tag => {
      const tagButton = document.createElement('button')
      tagButton.textContent = `#${tag}`
      tagButton.className = 'tag-button'
      
      if (tagFilter.has(tag)) {
        tagButton.classList.add('active')
      }
      
      tagButton.addEventListener('click', () => {
        if (tagFilter.has(tag)) {
          tagFilter.delete(tag)
          tagButton.classList.remove('active')
        } else {
          tagFilter.add(tag)
          tagButton.classList.add('active')
        }
        filterMessagesByTags()
      })
      
      tagsContainer.appendChild(tagButton)
    })
  }
  
  // Update filter status
  updateFilterStatus()
}

// Filter messages by selected tags
function filterMessagesByTags() {
  const messages = document.querySelectorAll('.text-message, .news, .reaction-message, .label-message')
  
  messages.forEach(message => {
    const messageText = message.textContent || message.innerText || ''
    const messageTags = extractHashtags(messageText)
    
    if (tagFilter.size === 0) {
      // No tag filter - show all messages (unless hidden by search)
      if (!message.classList.contains('search-hidden')) {
        message.classList.remove('tag-hidden')
      }
    } else {
      // Check if message contains any of the selected tags
      const hasMatchingTag = messageTags.some(tag => tagFilter.has(tag))
      
      if (hasMatchingTag && !message.classList.contains('search-hidden')) {
        message.classList.remove('tag-hidden')
      } else {
        message.classList.add('tag-hidden')
      }
    }
  })
  
  updateMessageCount()
}

// Update filter status display
function updateFilterStatus() {
  let statusDisplay = document.querySelector('.filter-status')
  if (!statusDisplay) {
    statusDisplay = document.createElement('div')
    statusDisplay.className = 'filter-status'
    const filterBar = document.querySelector('.filter-bar')
    if (filterBar) {
      filterBar.appendChild(statusDisplay)
    }
  }
  
  if (tagFilter.size === 0) {
    statusDisplay.textContent = 'No tag filters active'
  } else {
    const activeTags = Array.from(tagFilter).map(tag => `#${tag}`).join(', ')
    statusDisplay.textContent = `Filtering by: ${activeTags}`
  }
}

// Update message count to include tag filtering
function updateMessageCount() {
  const visibleMessages = document.querySelectorAll('.text-message:not(.hidden):not(.tag-hidden), .news:not(.hidden):not(.tag-hidden), .reaction-message:not(.hidden):not(.tag-hidden), .label-message:not(.hidden):not(.tag-hidden)')
  const totalMessages = document.querySelectorAll('.text-message, .news, .reaction-message, .label-message')
  
  console.log('Visible messages:', visibleMessages.length, 'Total messages:', totalMessages.length)
  
  // Create or update count display
  let countDisplay = document.querySelector('.search-count')
  if (!countDisplay) {
    countDisplay = document.createElement('div')
    countDisplay.className = 'search-count'
    const toolbar = document.querySelector('.search-toolbar')
    if (toolbar) {
      toolbar.appendChild(countDisplay)
    }
  }
  
  countDisplay.textContent = `Showing ${visibleMessages.length} of ${totalMessages.length} messages`
}

// Initialize filter bar functionality
function initFilterBar() {
  console.log('Initializing filter bar...')
  
  // Try multiple selectors for the compose area
  const composeSelectors = [
    '.compose',
    '[data-tour*="compose"]',
    'textarea[placeholder*="Write"]',
    'textarea[placeholder*="reply"]'
  ]
  
  let compose = null
  for (const selector of composeSelectors) {
    compose = document.querySelector(selector)
    if (compose) {
      console.log('Found compose element with selector:', selector)
      break
    }
  }
  
  if (compose) {
    // Create filter bar
    const { filterBar, tagsContainer } = createFilterBar()
    
    // Insert after compose element (before search toolbar if it exists)
    const searchToolbar = document.querySelector('.search-toolbar')
    if (searchToolbar) {
      compose.parentNode.insertBefore(filterBar, searchToolbar)
    } else {
      compose.parentNode.insertBefore(filterBar, compose.nextSibling)
    }
    
    console.log('Filter bar added successfully')
    
    // Initial update
    setTimeout(() => {
      updateFilterBar()
    }, 1000)
  } else {
    console.log('Compose element not found, retrying in 1 second...')
    setTimeout(initFilterBar, 1000)
  }
}

// Override the existing filterMessages function to work with tag filtering
function overrideFilterMessages() {
  const originalFilterMessages = window.filterMessages
  if (originalFilterMessages) {
    window.filterMessages = function() {
      originalFilterMessages()
      // Apply tag filtering after search filtering
      filterMessagesByTags()
    }
  }
}

// Call the override after a short delay to ensure search.js is loaded
setTimeout(overrideFilterMessages, 100)

// Auto-initialize when DOM is ready
console.log('Filter bar script loaded')
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFilterBar)
} else {
  initFilterBar()
}
