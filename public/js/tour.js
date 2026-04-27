const tourCompleted =
 localStorage.getItem('tour') === 'complete'

let tourIsActive

function tour() {
 if (tourIsActive) {
  return
 }
 tourIsActive = true
 const elements = Array.from(
  document.querySelectorAll('*[data-tour]')
 ).filter(
  (x) => x.getBoundingClientRect().width > 0
 )

 let tourPointer = 0

 function exitTour() {
  document.body.removeChild(tourElement)
  document.body.removeChild(tourShade)
  localStorage.setItem('tour', 'complete')
  tourIsActive = false
 }

 function back() {
  if (tourPointer === 0) {
   tourPointer = elements.length - 1
  } else {
   tourPointer--
  }
  refreshTour()
 }

 function next() {
  if (tourPointer === elements.length - 1) {
   tourPointer = 0
   exitTour()
   const tourFinished = dialog(
    false, // Omit cancel button
    elem({
     tagName: 'h2',
     textContent: 'End of tour',
    }),
    elem({
     tagName: 'p',
     textContent:
      "You've reached the end of the Tag Me In tour." +
      ' You can start the tour over, or start using Tag Me In.',
    }),
    elem({
     events: {
      click: () => {
       tour()
       nextButton.focus()
       tourFinished.close()
      },
     },
     tagName: 'button',
     textContent: 'Restart tour',
    }),
    elem({
     events: {
      click: () => tourFinished.close(),
     },
     tagName: 'button',
     textContent: 'Done',
    })
   )
  } else {
   tourPointer++
   refreshTour()
  }
 }

 const exitButton = elem({
  tagName: 'button',
  textContent: 'Exit',
  events: {
   click: exitTour,
  },
 })

 const backButton = elem({
  tagName: 'button',
  textContent: 'Back',
  events: {
   click: back,
  },
 })

 const nextButton = elem({
  tagName: 'button',
  textContent: 'Next',
  events: {
   click: next,
  },
 })

 const tourButtons = elem({
  classes: ['tour-buttons'],
  children: [
   exitButton,
   backButton,
   nextButton,
  ],
 })

 const tourMessage = elem({
  tagName: 'p',
 })

 const tourElement = elem({
  classes: ['tour-container'],
  children: [tourMessage, tourButtons],
 })

 const tourSelf = elem({
  children: [elem(), elem(), elem(), elem()],
 })

 const tourShade = elem({
  classes: ['tour-shade'],
  children: [tourSelf],
 })

 function repositionTour() {
  for (const t of Array.from(
   tourSelf.children
  )) {
   t.style.display = 'none'
  }
  const currentElement = elements[tourPointer]
  const box =
   currentElement.getBoundingClientRect()
  const self =
   tourElement.getBoundingClientRect()
  const pad = 10
  
  // Get current scroll position
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  // Use absolute positioning relative to the document
  tourElement.style.position = 'absolute'
  
  const moreRoomAbove =
   box.top > window.innerHeight / 2
  const moreRoomLeft = box.left > window.innerWidth / 2
  
  // Calculate available space in viewport
  const spaceAbove = box.top
  const spaceBelow = window.innerHeight - box.bottom
  const spaceLeft = box.left
  const spaceRight = window.innerWidth - box.right
  
  // Position vertically (Viewport top + Scroll top)
  if (moreRoomAbove && spaceAbove >= self.height + pad) {
   // Position above the element
   tourElement.style.top = `${scrollTop + box.top - self.height - pad}px`
  } else if (spaceBelow >= self.height + pad) {
   // Position below the element
   tourElement.style.top = `${scrollTop + box.bottom + pad}px`
  } else {
   // Fallback: position where there is more room
   if (spaceAbove > spaceBelow) {
    tourElement.style.top = `${scrollTop + Math.max(pad, box.top - self.height - pad)}px`
   } else {
    tourElement.style.top = `${scrollTop + Math.max(pad, box.bottom + pad)}px`
   }
  }
  tourElement.style.bottom = 'auto'
  
  // Position horizontally (Viewport left + Scroll left)
  if (moreRoomLeft && spaceRight >= self.width + pad) {
   // Position to the right
   tourElement.style.left = `${scrollLeft + box.right + pad}px`
  } else if (spaceLeft >= self.width + pad) {
   // Position to the left
   tourElement.style.left = `${scrollLeft + box.left - self.width - pad}px`
  } else {
   // Center horizontally if possible
   const leftPos = Math.max(pad, Math.min(
    window.innerWidth - self.width - pad,
    box.left
   ))
   tourElement.style.left = `${scrollLeft + leftPos}px`
  }
  tourElement.style.right = 'auto'
  
  // Position the highlight box (Absolute positioning with scroll offset)
  Object.assign(tourSelf.style, {
   position: 'absolute',
   left: `${scrollLeft + box.left}px`,
   top: `${scrollTop + box.top}px`,
   height: `${box.height}px`,
   width: `${box.width}px`,
  })
  
  // Prevent horizontal scroll
  document.body.scrollLeft = 0
  
  // Set the right-side shade width
  tourSelf.children[3].style.width =
   window.innerWidth - box.right + 'px'
  
  for (const t of Array.from(
   tourSelf.children
  )) {
   t.style.display = 'block'
  }
 }

 async function refreshTour() {
  const currentElement = elements[tourPointer]
  if (!currentElement) {
   exitTour()
   return
  }
  currentElement.scrollIntoView({
   behavior: 'instant',
   block: 'start',
   inline: 'start',
  })
  tourMessage.textContent =
   currentElement.getAttribute('data-tour')
  tourElement?.scrollIntoView({
   behavior: 'instant',
   block: 'center',
  })
  currentElement?.scrollIntoView({
   behavior: 'instant',
   block: 'center',
  })
  repositionTour()
  tourElement?.scrollIntoView({
   behavior: 'instant',
   block: 'center',
  })
  currentElement?.scrollIntoView({
   behavior: 'instant',
   block: 'center',
  })
  await new Promise((r) => setTimeout(r, 50))
  tourElement?.scrollIntoView({
   behavior: 'instant',
   block: 'center',
  })
  currentElement?.scrollIntoView({
   behavior: 'instant',
   block: 'center',
  })
  repositionTour()
 }

 document.body.appendChild(tourShade)
 document.body.appendChild(tourElement)

 refreshTour()

 nextButton.focus()
}

if (!tourCompleted) {
 setTimeout(tour, 50)
}
