require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const keydrop = require('./commands/keydrop.js');

// Start Express server to keep bot awake on some hosts
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Web server started on port ${PORT}`));

// ===== MONGODB SETUP =====
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  balance: { type: Number, default: 0 },
  inventory: { type: Object, default: {} },
  lastDaily: { type: Date, default: null },
  characters: { type: Array, default: [] },

  // profile fields
  profileColor: { type: String, default: null },
  profileBio: { type: String, default: null },
  profileBanner: { type: String, default: null },
});

const User = mongoose.model('User', userSchema);

// Admin Log Schema
const adminLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminUsername: { type: String, required: true },
  command: { type: String, required: true },
  action: { type: String, required: true },
  targetUserId: { type: String },
  targetUsername: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

async function logAdminAction(
  adminId,
  adminUsername,
  command,
  action,
  targetUserId = null,
  targetUsername = null,
  details = ''
) {
  try {
    const log = new AdminLog({
      adminId,
      adminUsername,
      command,
      action,
      targetUserId,
      targetUsername,
      details,
      timestamp: new Date(),
    });
    await log.save();
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// ===== DISCORD CLIENT SETUP =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();
const prefix = '.';

// ===== GLOBAL COOLDOWNS MAP (per user + command) =====
const cooldowns = new Map();
const COOLDOWN_MS = 5000;

// Load commands dynamically (EXCLUDE keydrop.js)
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== 'keydrop.js')
  : [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.name && command.execute) {
    client.commands.set(command.name, command);
  }
}

// Rarity and guessing-game config
const rarities = [
  { name: 'Prismatic', chance: 0.0001 },
  { name: 'Mythical', chance: 0.001 },
  { name: 'Legendary', chance: 0.01 },
  { name: 'Rare', chance: 0.05 },
  { name: 'Uncommon', chance: 0.10 },
  { name: 'Common', chance: 0.20 },
];

const rewardsByRarity = {
  Prismatic: { min: 500, max: 1000 },
  Mythical:  { min: 300, max: 600 },
  Legendary: { min: 200, max: 400 },
  Rare:      { min: 100, max: 200 },
  Uncommon:  { min: 50,  max: 100 },
  Common:    { min: 10,  max: 50 },
};

let guessGame = {
  active: false,
  number: null,
  channelId: null,
};

// ===== DB HELPERS =====
async function getUserData(userId) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({
      userId,
      balance: 0,
      inventory: {},
      lastDaily: null,
      characters: [],
    });
    await user.save();
  }
  return user.toObject();
}

async function saveUserData(userId, userData) {
  await User.updateOne(
    { userId },
    { $set: userData },
    { upsert: true }
  );
}

async function updateUserBalance(userId, amount) {
  const user = await User.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { upsert: true, new: true }
  );
  return user.toObject();
}

async function addKeyToInventory(userId, rarity, quantity) {
  const user = await getUserData(userId);
  user.inventory = user.inventory || {};
  user.inventory[rarity] = (user.inventory[rarity] || 0) + quantity;
  await saveUserData(userId, { inventory: user.inventory });
}

// ===== MESSAGE HANDLER =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Passive key drop system
  await keydrop.handleKeyDrop(message, client);

  // Passive guessing game
  if (guessGame.active && message.channel.id === guessGame.channelId) {
    const guess = parseInt(message.content);
    if (!isNaN(guess)) {
      if (guess === guessGame.number) {
        const wonRarity = getRandomRarity();
        const rewardRange = rewardsByRarity[wonRarity] || { min: 10, max: 50 };
        const rewardAmount =
          Math.floor(Math.random() * (rewardRange.max - rewardRange.min + 1)) +
          rewardRange.min;

        const userData = await getUserData(message.author.id);
        userData.inventory = userData.inventory || {};
        userData.inventory[wonRarity] = (userData.inventory[wonRarity] || 0) + 1;
        userData.balance += rewardAmount;

        await saveUserData(message.author.id, {
          inventory: userData.inventory,
          balance: userData.balance,
        });

        const winEmbed = new EmbedBuilder()
          .setTitle('Game Winner!')
          .setDescription(
            `${message.author} guessed the number **${guessGame.number}** and won a **${wonRarity}** key with **${rewardAmount} coins**!`
          )
          .setColor('Gold')
          .setTimestamp();

        message.channel.send({ embeds: [winEmbed] });

        guessGame.active = false;
        guessGame.number = null;
        guessGame.channelId = null;
      }
      return;
    }
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  // ===== RESTRICT KEY CHANNEL =====
  const KEYS_CHANNEL_ID = '1401925188991582338';
  const allowedInKeysChannel = ['redeem', 'hangman', 'inventory', 'inv', 'bal', 'baltop', 'claim'];

  if (
    message.channel.id === KEYS_CHANNEL_ID &&
    !allowedInKeysChannel.includes(command.name)
  ) {
    return;
  }
  // ================================

  // ===== PER-USER PER-COMMAND COOLDOWN (5s) =====
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Map());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = COOLDOWN_MS;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const remaining = ((expirationTime - now) / 1000).toFixed(1);
      return message.channel.send(
        `⏳ Please wait **${remaining}s** before using \`${prefix}${command.name}\` again.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  // ===============================================

  try {
    const userData = await getUserData(message.author.id);

    await command.execute({
      message,
      args,
      userData,
      saveUserData: (updatedData) => saveUserData(message.author.id, updatedData),
      updateUserBalance,
      addKeyToInventory,
      getUserData,
      keydrop,
      guessGame,
      rarities,
      prefix,
      client,
      logAdminAction,
      AdminLog,
    });
  } catch (error) {
    console.error('Error executing command:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('Command Error')
      .setDescription('An error occurred executing that command.')
      .setColor('Red')
      .setTimestamp();
    message.channel.send({ embeds: [errorEmbed] });
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== RARITY HELPER =====
function getRandomRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity.name;
  }
  return rarities[rarities.length - 1].name;
}

// ===== START BOT ONLY AFTER DB CONNECTS =====
async function startBot() {
  try {
    mongoose.connection.on('error', err => {
      console.error('Mongo connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.error('Mongo disconnected');
    });

    await mongoose.connect(process.env.MONGO_URI); // wait for connection[web:358][web:360]
    console.log('Connected to MongoDB');

    await client.login(process.env.DISCORD_TOKEN);
    console.log('Bot logged in');
  } catch (err) {
    console.error('Failed to start bot:', err);
    process.exit(1);
  }
}

startBot();
