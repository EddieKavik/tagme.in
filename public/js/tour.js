// Enhanced Tour System - 8-13-2025
// Complete tour implementation with all visible features and fixed positioning

const tourCompleted = localStorage.getItem('tour') === 'complete'
let tourIsActive = false

// Tour steps configuration
const tourSteps = [
  {
    selector: '.toolbar .icon-home',
    message: 'Welcome to Tag Me In! This is the home button. Click it to return to the main channel.',
    position: 'bottom'
  },
  {
    selector: '.channel-input',
    message: 'Enter channel names here to navigate between different conversations.',
    position: 'bottom'
  },
  {
    selector: '.toolbar .input-icon',
    message: 'Search for messages across all channels using this search icon.',
    position: 'bottom'
  },
  {
    selector: '.toolbar button[data-tour*="light"]',
    message: 'Switch between light and dark themes to match your preference.',
    position: 'bottom'
  },
  {
    selector: '.toolbar button[data-tour*="full screen"]',
    message: 'Toggle full screen mode for an immersive experience.',
    position: 'bottom'
  },
  {
    selector: '.realm',
    message: 'These are your realms - different communities you can join and participate in.',
    position: 'bottom'
  },
  {
    selector: '.realm .close',
    message: 'Close realms you no longer want to see in your list.',
    position: 'top'
  },
  {
    selector: '.compose-area',
    message: 'Type your messages here and press Enter to send them to the current channel.',
    position: 'top'
  },
  {
    selector: '.compose-area textarea',
    message: 'This is where you compose your messages. You can also paste image URLs to share pictures.',
    position: 'top'
  },
  {
    selector: '.message-footer',
    message: 'Each message has actions like agree/disagree and reply options.',
    position: 'top'
  },
  {
    selector: '.agree',
    message: 'Click to agree with a message and increase its score.',
    position: 'top'
  },
  {
    selector: '.disagree',
    message: 'Click to disagree with a message and decrease its score.',
    position: 'top'
  },
  {
    selector: '.image-container',
    message: 'Click on images to view them in full screen gallery mode with navigation.',
    position: 'top'
  },
  {
    selector: '.filterbar',
    message: 'Use filters to find specific types of content or messages.',
    position: 'bottom'
  },
  {
    selector: '.footer',
    message: 'Access privacy settings and remove consent here.',
    position: 'top'
  }
]

function startTour() {
 if (tourIsActive) {
  return
 }
  
 tourIsActive = true
  let currentStep = 0
  
  // Create tour overlay
  const tourOverlay = document.createElement('div')
  tourOverlay.className = 'tour-overlay'
  tourOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 100000;
    pointer-events: auto;
  `
  
  // Create tour popup
  const tourPopup = document.createElement('div')
  tourPopup.className = 'tour-popup'
  tourPopup.style.cssText = `
    position: fixed;
    background-color: var(--color-bg-light, #2a2a2a);
    border: 1px solid var(--color-border-medium, #444);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    color: var(--color-text-primary, #fff);
    min-width: 300px;
    max-width: 400px;
    z-index: 100001;
    font-family: inherit;
  `
  
  // Create tour content
  const tourContent = document.createElement('div')
  tourContent.style.cssText = `
    padding: 20px;
    font-size: 16px;
    line-height: 1.5;
  `
  
  // Create tour buttons
  const tourButtons = document.createElement('div')
  tourButtons.style.cssText = `
    display: flex;
    border-top: 1px solid var(--color-border-medium, #444);
    background-color: var(--color-bg-medium, #333);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  `
  
  const exitButton = document.createElement('button')
  exitButton.textContent = 'Exit'
  exitButton.style.cssText = `
    flex: 1;
    background-color: var(--color-bg-medium, #333);
    color: var(--color-text-primary, #fff);
    border: none;
    padding: 12px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-bottom-left-radius: 10px;
  `
  
  const backButton = document.createElement('button')
  backButton.textContent = 'Back'
  backButton.style.cssText = `
    flex: 1;
    background-color: var(--color-bg-medium, #333);
    color: var(--color-text-primary, #fff);
    border: none;
    padding: 12px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-left: 1px solid var(--color-border-medium, #444);
  `
  
  const nextButton = document.createElement('button')
  nextButton.textContent = 'Next'
  nextButton.style.cssText = `
    flex: 1;
    background-color: var(--color-bg-accent, #0080f0);
    color: var(--color-text-primary, #fff);
    border: none;
    padding: 12px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-bottom-right-radius: 10px;
  `
  
  // Add hover effects
  ;[exitButton, backButton, nextButton].forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = button === nextButton ? '#0060c0' : '#444'
    })
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = button === nextButton ? '#0080f0' : '#333'
    })
  })
  
  // Assemble tour popup
  tourButtons.appendChild(exitButton)
  tourButtons.appendChild(backButton)
  tourButtons.appendChild(nextButton)
  tourPopup.appendChild(tourContent)
  tourPopup.appendChild(tourButtons)
  
  // Add to DOM
  document.body.appendChild(tourOverlay)
  document.body.appendChild(tourPopup)
  
  // Highlight current element
  let currentHighlight = null
  
  function highlightElement(element) {
    if (currentHighlight) {
      currentHighlight.style.outline = ''
      currentHighlight.style.outlineOffset = ''
    }
    
    if (element) {
      element.style.outline = '3px solid #0080f0'
      element.style.outlineOffset = '2px'
      currentHighlight = element
    }
  }
  
  function positionTourPopup(element, position = 'bottom') {
    if (!element) return
    
    const elementRect = element.getBoundingClientRect()
    const popupRect = tourPopup.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 20
    
    let top, left
    
    // Calculate position based on element location
    if (position === 'bottom') {
      top = elementRect.bottom + padding
      if (top + popupRect.height > viewportHeight) {
        top = elementRect.top - popupRect.height - padding
      }
    } else {
      top = elementRect.top - popupRect.height - padding
      if (top < 0) {
        top = elementRect.bottom + padding
      }
    }
    
    // Horizontal positioning
    left = elementRect.left + (elementRect.width / 2) - (popupRect.width / 2)
    
    // Ensure popup stays within viewport
    if (left < padding) {
      left = padding
    } else if (left + popupRect.width > viewportWidth - padding) {
      left = viewportWidth - popupRect.width - padding
    }
    
    // Ensure top stays within viewport
    if (top < padding) {
      top = padding
    } else if (top + popupRect.height > viewportHeight - padding) {
      top = viewportHeight - popupRect.height - padding
    }
    
    tourPopup.style.top = `${top}px`
    tourPopup.style.left = `${left}px`
  }
  
  function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) {
      return
    }
    
    const step = tourSteps[stepIndex]
    const element = document.querySelector(step.selector)
    
    if (element) {
      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
      
      // Wait for scroll to complete
      setTimeout(() => {
        highlightElement(element)
        positionTourPopup(element, step.position)
        tourContent.textContent = step.message
        
        // Update button states
        backButton.disabled = stepIndex === 0
        nextButton.textContent = stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'
        
        // Focus next button
        nextButton.focus()
      }, 300)
    } else {
      // Element not found, skip to next
      if (stepIndex < tourSteps.length - 1) {
        showStep(stepIndex + 1)
      }
    }
  }

 function exitTour() {
    if (currentHighlight) {
      currentHighlight.style.outline = ''
      currentHighlight.style.outlineOffset = ''
    }
    document.body.removeChild(tourOverlay)
    document.body.removeChild(tourPopup)
  localStorage.setItem('tour', 'complete')
  tourIsActive = false
 }

  function goBack() {
    if (currentStep > 0) {
      currentStep--
      showStep(currentStep)
    }
  }
  
  function goNext() {
    if (currentStep < tourSteps.length - 1) {
      currentStep++
      showStep(currentStep)
  } else {
      // Tour completed
      exitTour()
      showTourCompletion()
    }
  }
  
  function showTourCompletion() {
    const completionDialog = dialog(
    elem({
     tagName: 'h2',
        textContent: 'Tour Complete! 🎉'
    }),
    elem({
     tagName: 'p',
        textContent: "You've completed the Tag Me In tour! You now know how to navigate and use all the main features. You can restart the tour anytime by clicking the logo."
    }),
    elem({
        tagName: 'button',
        textContent: 'Restart Tour',
     events: {
      click: () => {
            completionDialog.close()
            setTimeout(() => startTour(), 100)
          }
        }
    }),
    elem({
     tagName: 'button',
     textContent: 'Done',
        events: {
          click: () => completionDialog.close()
        }
      })
    )
  }
  
  // Event listeners
  exitButton.addEventListener('click', exitTour)
  backButton.addEventListener('click', goBack)
  nextButton.addEventListener('click', goNext)
  
  // Keyboard navigation
  function handleKeydown(e) {
    switch (e.key) {
      case 'Escape':
        exitTour()
        break
      case 'ArrowLeft':
        if (!backButton.disabled) goBack()
        break
      case 'ArrowRight':
      case 'Enter':
        goNext()
        break
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // Click outside to exit
  tourOverlay.addEventListener('click', (e) => {
    if (e.target === tourOverlay) {
   exitTour()
    }
  })
  
  // Start with first step
  showStep(0)
}

// Auto-start tour if not completed
if (!tourCompleted) {
  setTimeout(startTour, 1000)
}

// Export tour function for manual start
window.startTour = startTour
