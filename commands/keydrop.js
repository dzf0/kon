const { EmbedBuilder } = require('discord.js');

// Add this: the channel ID where keys can drop (replace with your channel's ID)
const KEYDROP_CHANNEL_ID = '1405349401945178152'; // <-- change to actual ID

// Global key state stored in memory
let currentKey = null;

// Rarity setup (should match your reward/rarity logic)
const rarities = [
  { name: 'Prismatic', chance: 0.005 },
  { name: 'Mythical', chance: 0.03 },
  { name: 'Legendary', chance: 0.05 },
  { name: 'Rare', chance: 0.10 },
  { name: 'Uncommon', chance: 0.15 },
  { name: 'Common', chance: 0.20 }
];

// Utility function
function getRandomRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity.name;
  }
  return rarities[rarities.length - 1].name;
}

// Call this for every new message to run keydrop checks
async function handleKeyDrop(message, client) {
  if (message.author.bot) return;

  // Only allow drops and expiration messages in the keydrop channel:
  if (message.channel.id !== KEYDROP_CHANNEL_ID) return; // <<< ADDED LINE

  // Expiration: expire active key randomly (10% chance)
  if (currentKey && !currentKey.claimed) {
    if (Math.random() <= 0.05) {
      const channel = client.channels.cache.get(currentKey.channelId);
      if (channel) {
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

  // Drop a new key (10% chance per message if none is active)
  if (!currentKey && Math.random() <= 0.05) {
    const rarity = getRandomRarity();
    currentKey = { rarity, channelId: message.channel.id, claimed: false };
    const dropEmbed = new EmbedBuilder()
      .setTitle('Key Dropped')
      .setDescription(`A **${rarity}** key dropped! Type \`!claim\` to claim it!`)
      .setColor('Green')
      .setTimestamp();
    message.channel.send({ embeds: [dropEmbed] });
  }
}

// Function to claim the active key
function claimKey(userId, data, addKeyToInventory, saveUserData) {
  if (currentKey && !currentKey.claimed) {
    // Give key to user and save
    addKeyToInventory(userId, currentKey.rarity, 1, data);
    saveUserData(data);

    // Mark key as claimed
    currentKey.claimed = true;
    currentKey = null;
    return true;
  }
  return false;
}

// For debugging/testing: expose currentKey
function getCurrentKey() {
  return currentKey;
}

module.exports = {
  handleKeyDrop,
  claimKey,
  getCurrentKey
};
