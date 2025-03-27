// index.js - Main app file

// Configuration
const API_KEY = "YOUR_TORN_API_KEY";
const CHECK_INTERVAL = 60000; // Check every minute

// State variables to track previous values
let previousStats = {
  energy: { current: 0, maximum: 0 },
  nerve: { current: 0, maximum: 0 },
  life: { current: 0, maximum: 0 },
  happy: { current: 0, maximum: 0 },
  knownMessages: [],
  knownEvents: []
};

// HTML Elements
document.addEventListener('DOMContentLoaded', () => {
  // Set up UI
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container">
      <h1>Torn API Notifications</h1>
      
      <div class="api-key-container">
        <input type="password" id="api-key-input" placeholder="Enter your Torn API key" />
        <button id="save-api-key">Save Key</button>
      </div>
      
      <div class="stats-container">
        <h2>Stats Monitor</h2>
        <div id="stats-display">
          <div class="loading">Connect your API key to view stats...</div>
        </div>
      </div>
      
      <div class="notifications-settings">
        <h2>Notification Settings</h2>
        <div class="notification-option">
          <input type="checkbox" id="energy-notification" checked />
          <label for="energy-notification">Energy Bar Full</label>
        </div>
        <div class="notification-option">
          <input type="checkbox" id="nerve-notification" checked />
          <label for="nerve-notification">Nerve Bar Full</label>
        </div>
        <div class="notification-option">
          <input type="checkbox" id="life-notification" checked />
          <label for="life-notification">Life Decreased</label>
        </div>
        <div class="notification-option">
          <input type="checkbox" id="happy-notification" checked />
          <label for="happy-notification">Happy Decreased</label>
        </div>
        <div class="notification-option">
          <input type="checkbox" id="messages-notification" checked />
          <label for="messages-notification">New Messages</label>
        </div>
        <div class="notification-option">
          <input type="checkbox" id="events-notification" checked />
          <label for="events-notification">New Events</label>
        </div>
      </div>
      
      <div class="notification-log">
        <h2>Notification Log</h2>
        <div id="notification-history"></div>
      </div>
    </div>
  `;

  // Load saved API key
  const savedApiKey = localStorage.getItem('tornApiKey');
  if (savedApiKey) {
    document.getElementById('api-key-input').value = savedApiKey;
    startMonitoring(savedApiKey);
  }

  // Save API key
  document.getElementById('save-api-key').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
      localStorage.setItem('tornApiKey', apiKey);
      startMonitoring(apiKey);
    }
  });

  // Request notification permission
  if ("Notification" in window) {
    Notification.requestPermission();
  }
});

// Start monitoring
function startMonitoring(apiKey) {
  fetchData(apiKey);
  setInterval(() => fetchData(apiKey), CHECK_INTERVAL);
}

// Fetch data from Torn API
async function fetchData(apiKey) {
  try {
    const statsResponse = await fetch(`https://api.torn.com/user/?selections=bars,messages,events&key=${apiKey}`);
    const statsData = await statsResponse.json();
    
    if (statsData.error) {
      updateStatsDisplay(`API Error: ${statsData.error.error}`);
      return;
    }
    
    updateStatsDisplay(statsData);
    checkNotifications(statsData);
    
  } catch (error) {
    updateStatsDisplay(`Error: ${error.message}`);
  }
}

// Update stats display
function updateStatsDisplay(statsData) {
  const statsDisplay = document.getElementById('stats-display');
  
  if (typeof statsData === 'string') {
    statsDisplay.innerHTML = `<div class="error">${statsData}</div>`;
    return;
  }
  
  const { energy, nerve, life, happy } = statsData;
  
  statsDisplay.innerHTML = `
    <div class="stat-bar">
      <div class="stat-label">Energy</div>
      <div class="stat-progress">
        <div class="progress-bar" style="width: ${(energy.current / energy.maximum) * 100}%"></div>
      </div>
      <div class="stat-value">${energy.current}/${energy.maximum}</div>
    </div>
    <div class="stat-bar">
      <div class="stat-label">Nerve</div>
      <div class="stat-progress">
        <div class="progress-bar" style="width: ${(nerve.current / nerve.maximum) * 100}%"></div>
      </div>
      <div class="stat-value">${nerve.current}/${nerve.maximum}</div>
    </div>
    <div class="stat-bar">
      <div class="stat-label">Life</div>
      <div class="stat-progress">
        <div class="progress-bar" style="width: ${(life.current / life.maximum) * 100}%"></div>
      </div>
      <div class="stat-value">${life.current}/${life.maximum}</div>
    </div>
    <div class="stat-bar">
      <div class="stat-label">Happy</div>
      <div class="stat-progress">
        <div class="progress-bar" style="width: ${(happy.current / happy.maximum) * 100}%"></div>
      </div>
      <div class="stat-value">${happy.current}/${happy.maximum}</div>
    </div>
    <div class="stat-extra">
      <div>Messages: ${Object.keys(statsData.messages || {}).length} (${countUnreadMessages(statsData.messages)} unread)</div>
      <div>Events: ${Object.keys(statsData.events || {}).length} new</div>
    </div>
  `;
}

// Count unread messages
function countUnreadMessages(messages) {
  if (!messages) return 0;
  return Object.values(messages).filter(msg => msg.seen === 0).length;
}

// Check for notifications
function checkNotifications(statsData) {
  const { energy, nerve, life, happy, messages, events } = statsData;
  
  // Check energy
  if (document.getElementById('energy-notification').checked) {
    if (energy.current === energy.maximum && previousStats.energy.current < previousStats.energy.maximum) {
      sendNotification('Energy Full', 'Your energy bar is now full!');
    }
  }
  
  // Check nerve
  if (document.getElementById('nerve-notification').checked) {
    if (nerve.current === nerve.maximum && previousStats.nerve.current < previousStats.nerve.maximum) {
      sendNotification('Nerve Full', 'Your nerve bar is now full!');
    }
  }
  
  // Check life
  if (document.getElementById('life-notification').checked) {
    if (life.current < previousStats.life.current) {
      sendNotification('Life Decreased', `Your life has decreased to ${life.current}/${life.maximum}`);
    }
  }
  
  // Check happy
  if (document.getElementById('happy-notification').checked) {
    if (happy.current < previousStats.happy.current) {
      sendNotification('Happy Decreased', `Your happiness has decreased to ${happy.current}/${happy.maximum}`);
    }
  }
  
  // Check messages
  if (document.getElementById('messages-notification').checked && messages) {
    const newMessages = [];
    const knownMessageIds = previousStats.knownMessages;
    
    Object.keys(messages).forEach(msgId => {
      if (!knownMessageIds.includes(msgId) && messages[msgId].seen === 0) {
        newMessages.push(messages[msgId]);
        knownMessageIds.push(msgId);
      }
    });
    
    if (newMessages.length === 1) {
      sendNotification('New Message', `From: ${newMessages[0].name}, Subject: ${newMessages[0].title}`);
    } else if (newMessages.length > 1) {
      sendNotification('New Messages', `You have ${newMessages.length} new messages`);
    }
    
    previousStats.knownMessages = knownMessageIds;
  }
  
  // Check events
  if (document.getElementById('events-notification').checked && events) {
    const newEvents = [];
    const knownEventIds = previousStats.knownEvents;
    
    Object.keys(events).forEach(eventId => {
      if (!knownEventIds.includes(eventId)) {
        newEvents.push(events[eventId]);
        knownEventIds.push(eventId);
      }
    });
    
    if (newEvents.length === 1) {
      sendNotification('New Event', newEvents[0].event);
    } else if (newEvents.length > 1) {
      sendNotification('New Events', `You have ${newEvents.length} new events`);
    }
    
    previousStats.knownEvents = knownEventIds;
  }
  
  // Update previous stats
  previousStats.energy = { ...energy };
  previousStats.nerve = { ...nerve };
  previousStats.life = { ...life };
  previousStats.happy = { ...happy };
}

// Send notification
function sendNotification(title, body) {
  // Log notification
  const notificationHistory = document.getElementById('notification-history');
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = 'notification-entry';
  logEntry.innerHTML = `
    <div class="notification-time">${timestamp}</div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-body">${body}</div>
    </div>
  `;
  notificationHistory.prepend(logEntry);
  
  // Browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
  
  // Sound
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');
  audio.play();
}
