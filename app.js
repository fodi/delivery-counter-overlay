// default config
const defaultChannel = 'twitch'
const defaultCommandQuery = '!count'
const defaultCounterTimeoutSeconds = 5
const defaultCounterCooldownSeconds = 30

// import dependencies
import { ChatClient } from 'https://cdn.jsdelivr.net/npm/@twurple/chat@7.2.1/+esm'

// macros
const _TODAY = '_today'
const _PREVIOUS = '_previous'

// override defaults with URL params
const params = new URLSearchParams(window.location.search)
const channel = params.get('channel') ?? defaultChannel
const adminUser = params.get('admin') ?? channel
const commandQuery = params.get('cmd_query') ?? defaultCommandQuery
const commandToday = params.get('cmd_today') ?? '!today'
const commandOld = params.get('cmd_old') ?? '!old'
const counterTimeoutSeconds = parseInt(params.get('timeout')) || defaultCounterTimeoutSeconds
const counterCooldownSeconds = parseInt(params.get('cooldown')) || defaultCounterCooldownSeconds

const elCounter = document.querySelector('.counter')
const localStorageKeyPrefix = 'fodi-counter-overlay_' + channel

let displayCounterCooldownTimeout = null
let displayCounterCooldown = false

// update counts at the start
updateCounts()

// MARK: connect to chat
console.log('Connecting to channel:', channel)

const chatClient = new ChatClient({ channels: [channel] })
await chatClient.connect()
const messageListener = chatClient.onMessage(async (channel, user, message, msg) => {
    //console.log("message:", message)

    if (user === adminUser) { // admin commands
        message = message.trim()

        if (message === commandQuery) {
            showCounter()
        } else if (message.startsWith(commandToday)) {
            // get count from the end of the message
            const count = parseInt(message.match(/\d+/)[0]) || 0
            const operation = message.charAt(commandToday.length)
            if (operation === '+') {
                localStorage.setItem(localStorageKeyPrefix + _TODAY, getCount(_TODAY) + count)
            } else if (operation === '-') {
                localStorage.setItem(localStorageKeyPrefix + _TODAY, getCount(_TODAY) - count)
            } else if (operation === '=') {
                localStorage.setItem(localStorageKeyPrefix + _TODAY, count)
            }
            updateCounts()
            // if message starts with old=, set the previous counter to that number
        } else if (message.startsWith(commandOld + '=')) {
            const count = parseInt(message.match(/\d+/)[0]) || 0
            localStorage.setItem(localStorageKeyPrefix + _PREVIOUS, count)
            updateCounts()
        } else {
            //console.log('skipping message: ' + message)
        }

    } else { // non-admin commands
        if (message.trim() === commandQuery) {
            if (!displayCounterCooldown) {
                displayCounterCooldown = true
                showCounter()
                displayCounterCooldownTimeout = setTimeout(() => {
                    displayCounterCooldown = false
                }, counterCooldownSeconds * 1000)
            } else {
                console.log('Cooldown is still running, skipping counter display')
            }
        }

    }
})

// MARK: functions

function showCounter() {
    elCounter.classList.add('visible')
    setTimeout(() => {
        hideCounter()
    }, counterTimeoutSeconds * 1000)
}

function hideCounter() {
    elCounter.classList.remove('visible')
}

function updateCounts() {
    document.querySelector('#counter-today').textContent = getCount(_TODAY)
    document.querySelector('#counter-total').textContent = getCount(_TODAY) + getCount(_PREVIOUS)
    showCounter()
}

function getCount(suffix) {
    const count = parseInt(localStorage.getItem(localStorageKeyPrefix + suffix)) || 0
    console.log('getCount: ', suffix, count)
    return count
}