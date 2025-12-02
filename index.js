require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const keydrop = require('./commands/keydrop.js'); // Import keydrop module

// Start Express server to keep bot awake on some hosts
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Web server started on port ${PORT}`));

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions, // important for blackjack & reactions
  ],
});

client.commands = new Collection();
const prefix = '.';

// Load commands dynamically
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
  : [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.name && command.execute) {
    client.commands.set(command.name, command);
  }
}

// User data stored in-memory, backed by data.json
let userData = {};

function loadUserData() {
  try {
    if (fs.existsSync('./data.json')) {
      userData = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load user data:', e);
  }
}

function saveUserData() {
  try {
    fs.writeFileSync('./data.json', JSON.stringify(userData, null, 2));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}

// Helper to add keys (used by keydrop/claim/admin)
function addKeyToInventory(userId, rarity, quantity) {
  userData[userId] = userData[userId] || { inventory: {}, balance: 0 };
  userData[userId].inventory[rarity] =
    (userData[userId].inventory[rarity] || 0) + quantity;
  saveUserData();
}

loadUserData();

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

        userData[message.author.id] =
          userData[message.author.id] || { inventory: {}, balance: 0 };
        userData[message.author.id].inventory[wonRarity] =
          (userData[message.author.id].inventory[wonRarity] || 0) + 1;
        userData[message.author.id].balance += rewardAmount;
        saveUserData();

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
      return; // ignore wrong numeric guesses silently
    }
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute({
      message,
      args,
      userData,
      saveUserData,
      addKeyToInventory,
      keydrop,
      guessGame,
      rarities,
      prefix,
      client,
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

function getRandomRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity.name;
  }
  return rarities[rarities.length - 1].name;
}

client.login(process.env.DISCORD_TOKEN);
