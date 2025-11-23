const fs = require('fs');
const path = require('path');
const dataFile = path.resolve(__dirname, 'data.json'); // Absolute path to avoid path issues

// Load user data from file or return empty object
function loadUserData() {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load user data:', e);
  }
  return {};
}

// Save user data object to file
function saveUserData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}

// Get user's current balance, or 0 if none
function getUserBalance(userId, data) {
  return data[userId] ? data[userId].balance || 0 : 0;
}

// Add Kan to user's balance and save immediately
function addKanToUser(userId, amount, data) {
  if (!data[userId]) {
    data[userId] = { balance: 0 };
  } else if (typeof data[userId].balance !== 'number') {
    data[userId].balance = 0;
  }
  data[userId].balance += amount;
  saveUserData(data);
}

module.exports = {
  loadUserData,
  saveUserData,
  getUserBalance,
  addKanToUser
};
