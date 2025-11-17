require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');

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
  ],
});

client.commands = new Collection();
const prefix = '!';

// Load commands dynamically
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath) ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')) : [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if(command.name && command.execute) client.commands.set(command.name, command);
}

// User data stored in-memory, hook your database or file loader here
let userData = {};
function loadUserData() {
  try {
    if(fs.existsSync('./userdata.js')) {
      userData = JSON.parse(fs.readFileSync('./userdata.js', 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load user data:', e);
  }
}
function saveUserData() {
  try {
    fs.writeFileSync('./userdata.js', JSON.stringify(userData, null, 2));
  } catch(e) {
    console.error('Failed to save user data:', e);
  }
}
loadUserData();

// Key rarities
const rarities = [
  { name: 'Prismatic', chance: 0.01 },
  { name: 'Mythical', chance: 0.05 },
  { name: 'Legendary', chance: 0.10 },
  { name: 'Rare', chance: 0.20 },
  { name: 'Uncommon', chance: 0.30 },
  { name: 'Common', chance: 0.50 },
];

// Utility: get random rarity by chance
function getRandomRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity.name;
  }
  return rarities[rarities.length - 1].name;
}

// Key state
let currentKey = null; // { rarity, channelId, claimed }
let guessGame = {
  active: false,
  number: null,
  channelId: null,
};

client.on('messageCreate', async (message) => {
  if(message.author.bot) return;

  // Existing unclaimed key expires with 5% chance on message
  if(currentKey && !currentKey.claimed) {
    if(Math.random() <= 0.10) {
      const channel = client.channels.cache.get(currentKey.channelId);
      if(channel) {
        const expireEmbed = new EmbedBuilder()
          .setTitle('Key Expired')
          .setDescription(`The **${currentKey.rarity}** key expired.`)
          .setColor('Red')
          .setTimestamp();
        channel.send({ embeds: [expireEmbed] });
      }
      currentKey = null;
    }
  }

  // Drop a new key with 5% chance if none active
  if(!currentKey && Math.random() <= 0.10) {
    const rarity = getRandomRarity();
    currentKey = { rarity, channelId: message.channel.id, claimed: false };
    const dropEmbed = new EmbedBuilder()
      .setTitle('Key Dropped')
      .setDescription(`A **${rarity}** key dropped! Type \`!claim\` to claim it!`)
      .setColor('Green')
      .setTimestamp();
    message.channel.send({ embeds: [dropEmbed] });
  }

  // Guessing game passive guess detection in the right channel
  if(guessGame.active && message.channel.id === guessGame.channelId) {
    const guess = parseInt(message.content);
    if(!isNaN(guess)) {
      if(guess === guessGame.number) {
        // Award a random rarity key (could create special guess game rarities if you want)
        const wonRarity = getRandomRarity();
        userData[message.author.id] = userData[message.author.id] || { inventory: {} };
        userData[message.author.id].inventory[wonRarity] = (userData[message.author.id].inventory[wonRarity] || 0) + 1;
        saveUserData();
        const winEmbed = new EmbedBuilder()
          .setTitle('Game Winner!')
          .setDescription(`${message.author} guessed the number **${guessGame.number}** and won a **${wonRarity}** key!`)
          .setColor('Gold')
          .setTimestamp();
        message.channel.send({ embeds: [winEmbed] });
        guessGame.active = false;
        guessGame.number = null;
        guessGame.channelId = null;
      }
      // Do not respond on wrong guesses
      return;
    }
  }

  // Command handling
  if(!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if(!command) return;

  try {
    await command.execute({
      message,
      args,
      userData,
      saveUserData,
      currentKey,
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

client.login(process.env.DISCORD_TOKEN);
