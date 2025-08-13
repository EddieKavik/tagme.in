// Gallery Feature - 8-13-2025
// Handles image gallery navigation functionality

let galleryImages = []
let currentGalleryIndex = -1
let galleryContainer = null

// Initialize gallery system
function initGallery() {
  galleryImages = []
  currentGalleryIndex = -1
  galleryContainer = null
}

// Add image to gallery
function addImageToGallery(imageElement, imageSrc) {
  const galleryItem = {
    element: imageElement,
    src: imageSrc,
    container: imageElement.closest('.image-container')
  }
  galleryImages.push(galleryItem)
}

// Get all images in current view for gallery
function collectGalleryImages() {
  galleryImages = []
  const imageContainers = document.querySelectorAll('.image-container')
  
  imageContainers.forEach((container, index) => {
    const img = container.querySelector('img')
    if (img && img.src) {
      addImageToGallery(img, img.src)
    }
  })
  
  // Also collect images that might not be in .image-container (for test pages)
  if (galleryImages.length === 0) {
    const allImages = document.querySelectorAll('img')
    allImages.forEach((img, index) => {
      if (img.src && img.src.startsWith('http')) {
        addImageToGallery(img, img.src)
      }
    })
  }
}

// Open image in gallery mode
function openImageInGallery(imageElement) {
  collectGalleryImages()
  
  // Find the index of the clicked image
  const clickedSrc = imageElement.src
  currentGalleryIndex = galleryImages.findIndex(item => item.src === clickedSrc)
  
  if (currentGalleryIndex === -1) {
    currentGalleryIndex = 0
  }
  
  // Create gallery container
  createGalleryContainer()
  showCurrentImage()
}

// Create gallery container with navigation
function createGalleryContainer() {
  // Remove existing gallery container if any
  if (galleryContainer) {
    document.body.removeChild(galleryContainer)
  }
  
  galleryContainer = elem({
    classes: ['gallery-container'],
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--color-bg-dark)',
      zIndex: '10001',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    children: [
      // Close button
      elem({
        classes: ['gallery-close'],
        style: {
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          borderRadius: '50%',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '10002'
        },
        textContent: '×',
        events: {
          click: closeGallery
        }
      }),
      
      // Previous button
      elem({
        classes: ['gallery-nav', 'gallery-prev'],
        style: {
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          borderRadius: '50%',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '10002'
        },
        textContent: '‹',
        events: {
          click: showPreviousImage
        }
      }),
      
      // Next button
      elem({
        classes: ['gallery-nav', 'gallery-next'],
        style: {
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          borderRadius: '50%',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '10002'
        },
        textContent: '›',
        events: {
          click: showNextImage
        }
      }),
      
      // Image container
      elem({
        classes: ['gallery-image-container'],
        style: {
          maxWidth: '95vw',
          maxHeight: '95vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }),
      
      // Image counter
      elem({
        classes: ['gallery-counter'],
        style: {
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: '10002'
        }
      })
    ],
    events: {
      click(e) {
        // Close gallery if clicking on background
        if (e.target === galleryContainer) {
          closeGallery()
        }
      }
    }
  })
  
  document.body.appendChild(galleryContainer)
  
  // Add keyboard navigation
  document.addEventListener('keydown', handleGalleryKeydown)
}

// Show current image in gallery
function showCurrentImage() {
  if (currentGalleryIndex < 0 || currentGalleryIndex >= galleryImages.length) {
    return
  }
  
  const currentItem = galleryImages[currentGalleryIndex]
  const imageContainer = galleryContainer.querySelector('.gallery-image-container')
  const counter = galleryContainer.querySelector('.gallery-counter')
  
  // Clear previous image
  imageContainer.innerHTML = ''
  
  // Add current image
  const img = elem({
    tagName: 'img',
    attributes: {
      src: currentItem.src,
      alt: 'Gallery image'
    },
    style: {
      maxWidth: '95vw',
      maxHeight: '95vh',
      objectFit: 'contain'
    }
  })
  
  imageContainer.appendChild(img)
  
  // Update counter
  counter.textContent = `${currentGalleryIndex + 1} / ${galleryImages.length}`
  
  // Update navigation button visibility
  updateNavigationButtons()
}

// Show previous image
function showPreviousImage() {
  if (galleryImages.length <= 1) return
  
  currentGalleryIndex = currentGalleryIndex <= 0 
    ? galleryImages.length - 1 
    : currentGalleryIndex - 1
  
  showCurrentImage()
}

// Show next image
function showNextImage() {
  if (galleryImages.length <= 1) return
  
  currentGalleryIndex = currentGalleryIndex >= galleryImages.length - 1 
    ? 0 
    : currentGalleryIndex + 1
  
  showCurrentImage()
}

// Update navigation button visibility
function updateNavigationButtons() {
  const prevButton = galleryContainer.querySelector('.gallery-prev')
  const nextButton = galleryContainer.querySelector('.gallery-next')
  
  if (galleryImages.length <= 1) {
    prevButton.style.display = 'none'
    nextButton.style.display = 'none'
  } else {
    prevButton.style.display = 'flex'
    nextButton.style.display = 'flex'
  }
}

// Handle keyboard navigation
function handleGalleryKeydown(e) {
  if (!galleryContainer) return
  
  switch (e.key) {
    case 'Escape':
      closeGallery()
      break
    case 'ArrowLeft':
      showPreviousImage()
      break
    case 'ArrowRight':
      showNextImage()
      break
  }
}

// Close gallery
function closeGallery() {
  if (galleryContainer) {
    document.body.removeChild(galleryContainer)
    galleryContainer = null
  }
  
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleGalleryKeydown)
  
  // Reset gallery state
  initGallery()
}

// Export gallery functions
window.gallery = {
  initGallery,
  addImageToGallery,
  collectGalleryImages,
  openImageInGallery,
  closeGallery,
  showPreviousImage,
  showNextImage
}

// Initialize gallery when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery)
} else {
  initGallery()
}
