const HOME_CHANNEL_ICON = '⌂'
const ONE_HOUR_MS = 60 * 60 * 1000

let focusOnMessage = undefined
let lastKnownChannelInput
let channelInputFocused = false
const channelInput = elem({
 attributes: {
  maxlength: 25,
  placeholder: 'Search channels',
 },
 events: {
  blur() {
   channelInputFocused = false
   autocompleteChannels.close()
   setChannel(channelInput.value.trim())
  },
  focus() {
   lastKnownChannelInput = channelInput.value
   channelInputFocused = true
   autocompleteChannels.open()
  },
  input() {
   autocompleteChannels.filter(
    channelInput.value.trim()
   )
  },
  keydown({ key }) {
   if (key === 'Enter') {
    channelInput.blur()
   }
  },
 },
 tagName: 'input',
})

function cancelChannelInput() {
 channelInput.value = lastKnownChannelInput
}

const autocompleteChannels =
 displayAutocompleteChannels(
  channelInput,
  cancelChannelInput
 )

addEventListener('keydown', ({ key }) => {
 if (key === 'Escape') {
  if (channelInputFocused) {
   cancelChannelInput()
   channelInput.blur()
  } else {
   channelInput.focus()
  }
 }
})

const loadingIndicator = elem({
 attributes: {
  inditerminate: 'true',
 },
 classes: ['loader'],
 tagName: 'progress',
})

const fullScreenButton = elem({
 attributes: {
  title: 'Toggle full screen',
 },
 children: [icon('in')],
 events: {
  click() {
   if (!document.fullscreenElement) {
    document.body
     .requestFullscreen()
     .catch((e) => console.error(e))
   } else {
    document.exitFullscreen()
   }
  },
 },
 tagName: 'button',
})

function setLightMode(lightMode) {
 if (lightMode) {
  document.body.classList.add('light-mode')
  localStorage.setItem('light-mode', '1')
 } else {
  document.body.classList.remove('light-mode')
  localStorage.removeItem('light-mode', '1')
 }
}

if (
 localStorage.getItem('light-mode') === '1'
) {
 setLightMode(true)
}

const lightDarkModeButton = elem({
 attributes: {
  title: 'Switch between light and dark mode',
 },
 children: [icon('sun')],
 events: {
  click() {
   if (
    document.body.classList.contains(
     'light-mode'
    )
   ) {
    setLightMode(false)
   } else {
    setLightMode(true)
   }
  },
 },
 tagName: 'button',
})

const appAccounts = displayAppAccounts()

const activityContainer = displayActivity()

const appHeader = elem({
 classes: ['app-header'],
 children: [
  elem({
   classes: ['toolbar'],
   children: [
    elem({
     classes: ['brand', 'grow'],
     tagName: 'span',
     textContent: 'Tag Me In',
    }),
    lightDarkModeButton,
    fullScreenButton,
   ],
  }),
  appAccounts.element,
  elem({
   classes: ['toolbar'],
   children: [
    elem({
     children: [
      elem({
       classes: [
        'icon',
        'icon-home',
        'display-on-channel',
       ],
       tagName: 'span',
      }),
      elem({
       classes: ['display-on-message'],
       children: [icon('back')],
       tagName: 'span',
      }),
     ],
     events: {
      click() {
       const { channel, message } = getUrlData()
       location.hash =
        typeof message === 'string'
         ? `#/${encodeURIComponent(channel)}`
         : '#'
       scrollToTop()
      },
     },
     tagName: 'button',
    }),
    loadingIndicator,
    channelInput,
    elem({
     classes: ['input-icon'],
     children: [icon('search')],
     tagName: 'button',
    }),
    elem({
     children: [
      elem({
       classes: ['icon', 'icon-news'],
       tagName: 'span',
      }),
     ],
     events: {
      click() {
       activityContainer.toggle()
      },
     },
     tagName: 'button',
    }),
   ],
  }),
 ],
})

let loaderCount = 0

async function withLoading(promise) {
 loaderCount++
 loadingIndicator.style.opacity = '1'
 try {
  const data = await promise
  return data
 } catch (e) {
  alert(e.message ?? e ?? 'Unknown error')
  return false
 } finally {
  loaderCount--
  if (loaderCount === 0) {
   loadingIndicator.style.opacity = '0'
  }
 }
}

const COMPOSE_PLACEHOLDER_MESSAGE =
 'Write a message (up to 150 characters)'

const COMPOSE_PLACEHOLDER_REPLY =
 'Write a reply (up to 150 characters)'

const composeTextarea = elem({
 attributes: {
  maxlength: '150',
  placeholder: COMPOSE_PLACEHOLDER_MESSAGE,
  required: 'required',
 },
 events: {
  blur() {
   composeTextarea.value =
    composeTextarea.value.trim()
  },
  input() {
   const parametersToRemove = ['si']
   const text = composeTextarea.value
   const urls =
    text.match(/\bhttps?:\/\/\S+/gi) || []
   composeTextarea.value = urls.reduce(
    (acc, url) => {
     try {
      let removed = false
      const urlObj = new URL(url)
      const searchParams = new URLSearchParams(
       urlObj.search
      )
      parametersToRemove.forEach((param) => {
       if (searchParams.has(param)) {
        searchParams.delete(param)
        removed = true
       }
      })
      urlObj.search = searchParams.toString()
      return removed
       ? acc.replace(url, urlObj.toString())
       : acc
     } catch {
      return acc
     }
    },
    text
   )
  },
 },
 tagName: 'textarea',
})

const compose = elem({
 children: [
  composeTextarea,
  elem({
   attributes: {
    title: 'Send message now',
   },
   children: [icon('plane')],
   classes: ['submit'],
   tagName: 'button',
  }),
 ],
 classes: ['compose'],

 events: {
  async submit(e) {
   e.preventDefault()
   const { messageChannel } = getUrlData()
   if (
    (await withLoading(
     networkMessageSend(
      messageChannel,
      composeTextarea.value,
      1
     )
    )) !== false
   ) {
    focusOnMessage = composeTextarea.value
    composeTextarea.value = ''
    route()
   }
  },
 },
 tagName: 'form',
})

const messageContent = elem({
 classes: ['message-content'],
})

const mainContent = elem({
 tagName: 'main',
})

const { body } = document
body.appendChild(appHeader)
body.appendChild(activityContainer.element)
body.appendChild(messageContent)
body.appendChild(compose)
body.appendChild(mainContent)
body.appendChild(
 document.getElementById('footer')
)

let lastScrollY = 0
addEventListener('scroll', () => {
 if (scrollY < lastScrollY) {
  body.classList.add('scroll-up')
 } else {
  body.classList.remove('scroll-up')
 }
 lastScrollY = scrollY
 if (scrollY > 0) {
  document.body.classList.remove('scroll-zero')
 } else {
  document.body.classList.add('scroll-zero')
 }
})

async function route() {
 const {
  channel,
  control,
  messageChannel,
  message: messageText,
 } = getUrlData()
 autocompleteChannels.visit(channel)
 activityContainer.clear()
 const activeSessionId = getActiveSessionId()
 if (activeSessionId !== PUBLIC_SESSION_ID) {
  if (
   await registerSession(
    activeSessionId,
    control
   )
  ) {
   return
  }
 }
 if (typeof messageText === 'string') {
  document.body.classList.remove('on-channel')
  document.body.classList.add('on-message')
  composeTextarea.setAttribute(
   'placeholder',
   COMPOSE_PLACEHOLDER_REPLY
  )
 } else {
  document.body.classList.remove('on-message')
  document.body.classList.add('on-channel')
  composeTextarea.setAttribute(
   'placeholder',
   COMPOSE_PLACEHOLDER_MESSAGE
  )
 }
 if (channelInput.value.trim() !== channel) {
  channelInput.value = channel
 }
 const channelData = await withLoading(
  networkChannelSeek(channel, getHourNumber())
 )
 const formattedMessageData = formatMessageData(
  channelData.response.messages
 )
 if (typeof messageText === 'string') {
  displayChannelMessage(
   channel,
   formattedMessageData,
   messageText
  )
  displayChannelMessageReplies(
   messageChannel,
   formattedMessageData,
   messageText
  ).catch((e) => console.error(e))
 } else {
  displayChannelHome(
   channel,
   formattedMessageData,
   formatChannelData(
    channelData.response.channels
   )
  )
 }
 scrollToTop()
}

window.addEventListener('hashchange', route)
route().catch((e) => console.error(e))
