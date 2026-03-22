// Message search toolbar functionality
//
// IMPORTANT: This file must not create DOM nodes at load time because
// `elem` / `icon` are defined in components.js (loaded later), and the
// `mainContent` element is created in main.js.

function initSearchToolbar({ mainContent }) {
 if (!mainContent) {
  throw new Error('initSearchToolbar: mainContent is required')
 }

let currentSearchTerms = []
let searchInputFocused = false

const filterMessages = () => {
 const newsItems = mainContent.querySelectorAll('.news')
 newsItems.forEach((newsItem) => {
  // Only search within messages that are currently visible (not hidden by tag filters)
  const isVisible = newsItem.style.display !== 'none'
  
  if (currentSearchTerms.length === 0) {
   // If no search terms, restore original visibility (respect tag filters)
   newsItem.style.display = isVisible ? '' : 'none'
   return
  }

  // Only search within messages that are currently visible
  if (!isVisible) {
   return // Skip messages already hidden by tag filters
  }

  const text = newsItem.textContent.toLowerCase()
  const matches = currentSearchTerms.every((term) =>
   text.includes(term)
  )
  newsItem.style.display = matches ? '' : 'none'
 })
}

const searchInput = elem({
 attributes: {
  placeholder: 'Search messages...',
  maxlength: 100,
 },
 events: {
  blur() {
   searchInputFocused = false
  },
  focus() {
   searchInputFocused = true
  },
  input() {
   const value = searchInput.value.trim().toLowerCase()
   currentSearchTerms = value ? value.split(/\s+/) : []
   filterMessages()
  },
 },
 tagName: 'input',
})

const clearSearch = () => {
 searchInput.value = ''
 currentSearchTerms = []
 filterMessages()
}

const element = elem({
 classes: ['search-toolbar', 'mode-main'],
 children: [
  elem({
   tagName: 'span',
   textContent: 'Search:',
  }),
  searchInput,
  elem({
   classes: ['clear-btn'],
   textContent: 'Clear',
   events: {
    click() {
     clearSearch()
    },
   },
   tagName: 'button',
  }),
 ],
})

return {
 clearSearch,
 element,
 filterMessages,
 searchInputFocused,
}
}

window.initSearchToolbar = initSearchToolbar
