// Top 10 Replies Feature
// This file adds functionality to display top 10 replies for parent messages

function initTop10Replies() {
 // Add CSS styles for top 10 replies
 const style = document.createElement('style')
 style.textContent = `
  .top-10-replies {
   margin-top: 10px;
   border-left: 3px solid var(--color-border-medium);
   padding-left: 15px;
   background: var(--color-bg-light);
   border-radius: 6px;
   padding: 10px 15px;
   margin-bottom: 15px;
  }
  
  .top-10-replies-header {
   font-weight: 600;
   color: var(--color-text-primary);
   margin-bottom: 8px;
   font-size: 14px;
   display: flex;
   align-items: center;
   gap: 8px;
  }
  
  .top-10-replies-header .reply-count {
   background: var(--color-bg-medium);
   color: var(--color-text-primary);
   padding: 2px 8px;
   border-radius: 12px;
   font-size: 12px;
   font-weight: 500;
  }
  
  .top-reply-item {
   margin: 8px 0;
   padding: 8px;
   background: var(--color-bg-dark);
   border-radius: 4px;
   border: 1px solid var(--color-border-light);
   font-size: 12px;
   line-height: 1.4;
   position: relative;
  }
  
  .top-reply-item:hover {
   border-color: var(--color-border-medium);
   background: var(--color-bg-medium);
  }
  
  .top-reply-text {
   color: var(--color-text-primary);
   margin-bottom: 4px;
  }
  
  .top-reply-meta {
   color: var(--color-text-secondary);
   font-size: 11px;
   opacity: 0.8;
  }
  
  .top-reply-channel {
   color: var(--color-text-secondary);
   font-size: 11px;
   opacity: 0.7;
   font-style: italic;
  }
  
  .view-all-replies {
   margin-top: 8px;
   padding: 4px 8px;
   background: var(--color-bg-medium);
   border: 1px solid var(--color-border-medium);
   border-radius: 4px;
   color: var(--color-text-primary);
   font-size: 11px;
   cursor: pointer;
   transition: all 0.2s ease;
  }
  
  .view-all-replies:hover {
   background: var(--color-bg-accent);
   border-color: var(--color-border-medium);
  }
  
  .no-replies {
   color: var(--color-text-secondary);
   font-style: italic;
   font-size: 12px;
   opacity: 0.7;
  }
 `
 document.head.appendChild(style)
}

// Function to create top 10 replies section for a message
function createTop10RepliesSection(channel, message, repliesData) {
 const repliesContainer = document.createElement('div')
 repliesContainer.className = 'top-10-replies'
 
 if (!repliesData || repliesData.length === 0) {
  const noReplies = document.createElement('div')
  noReplies.className = 'no-replies'
  noReplies.textContent = 'No replies yet'
  repliesContainer.appendChild(noReplies)
  return repliesContainer
 }
 
 // Create header
 const header = document.createElement('div')
 header.className = 'top-10-replies-header'
 header.innerHTML = `
  <span>💬 Top Replies</span>
  <span class="reply-count">${repliesData.length}</span>
 `
 repliesContainer.appendChild(header)
 
 // Take top 10 replies
 const topReplies = repliesData.slice(0, 10)
 
 topReplies.forEach((reply, index) => {
  const replyItem = document.createElement('div')
  replyItem.className = 'top-reply-item'
  
  const replyText = document.createElement('div')
  replyText.className = 'top-reply-text'
  replyText.textContent = reply.text || ''
  
  const replyMeta = document.createElement('div')
  replyMeta.className = 'top-reply-meta'
  replyMeta.textContent = reply.seen ? new Date(reply.seen).toLocaleString() : 'Unknown time'
  
  const replyChannel = document.createElement('div')
  replyChannel.className = 'top-reply-channel'
  replyChannel.textContent = `#${reply.channel || 'unknown'}`
  
  replyItem.appendChild(replyText)
  replyItem.appendChild(replyMeta)
  replyItem.appendChild(replyChannel)
  
  repliesContainer.appendChild(replyItem)
 })
 
 // Add "View all replies" button if there are more than 10
 if (repliesData.length > 10) {
  const viewAllBtn = document.createElement('button')
  viewAllBtn.className = 'view-all-replies'
  viewAllBtn.textContent = `View all ${repliesData.length} replies`
  viewAllBtn.addEventListener('click', () => {
   // Navigate to the full replies view
   const messageLink = `/#/${encodeURIComponent(channel)}/${btoa(encodeURIComponent(message.text))}`
   window.location.href = messageLink
  })
  repliesContainer.appendChild(viewAllBtn)
 }
 
 return repliesContainer
}

// Function to fetch and display top 10 replies for a message
async function fetchAndDisplayTop10Replies(messageElement, channel, message) {
 try {
  // Get the reply channel name
  const replyChannel = `replies@${encodeURIComponent(channel)}:${encodeURIComponent(message.text)}`
  
  // Fetch replies data
  const replyChannelData = await withLoading(
   networkChannelSeek(replyChannel, getHourNumber())
  )
  
  if (replyChannelData && replyChannelData.response && replyChannelData.response.messages) {
   const formattedReplies = formatMessageData(replyChannelData.response.messages)
   
   // Create and append top 10 replies section
   const repliesSection = createTop10RepliesSection(channel, message, formattedReplies)
   
   // Find where to insert the replies (after the message content)
   const messageContent = messageElement.querySelector('.message-content, article, .news')
   if (messageContent) {
    messageContent.parentNode.insertBefore(repliesSection, messageContent.nextSibling)
   }
  }
 } catch (error) {
  console.error('Error fetching replies:', error)
 }
}

// Enhanced attachMessage function to include top 10 replies
const originalAttachMessage = window.attachMessage

window.attachMessage = function(
 channel,
 container,
 message,
 includeFooter,
 sendToRealm,
 copyToReply,
 includeTourAttributes,
 includeReplies = false,
 includeReactions = false,
 messageContentFormatter = undefined
) {
 // Call the original function
 const result = originalAttachMessage.apply(this, arguments)
 
 // If this is a parent message (not a reply itself), add top 10 replies
 if (!channel.startsWith('replies@') && message.data && message.data.replies && message.data.replies.top) {
  // Find the message element that was just created
  const messageElements = container.querySelectorAll('.news')
  const lastMessageElement = messageElements[messageElements.length - 1]
  
  if (lastMessageElement) {
   // Create top 10 replies section
   const repliesSection = createTop10RepliesSection(channel, message, message.data.replies.top)
   
   // Append after the message
   lastMessageElement.parentNode.insertBefore(repliesSection, lastMessageElement.nextSibling)
  }
 }
 
 return result
}

// Initialize the feature
initTop10Replies()

// Make functions globally available
window.createTop10RepliesSection = createTop10RepliesSection
window.fetchAndDisplayTop10Replies = fetchAndDisplayTop10Replies
