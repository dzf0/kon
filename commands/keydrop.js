const { EmbedBuilder } = require('discord.js');

const KEYDROP_CHANNEL_ID = '1405349401945178152';

let currentKey = null;

const rarities = [
  { name: 'Prismatic', chance: 0.0001 },
  { name: 'Mythical', chance: 0.001 },
  { name: 'Legendary', chance: 0.01 },
  { name: 'Rare', chance: 0.05 },
  { name: 'Uncommon', chance: 0.10 },
  { name: 'Common', chance: 0.20 }
];

function getRandomRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity.name;
  }
  return rarities[rarities.length - 1].name;
}

async function handleKeyDrop(message, client) {
  if (message.author.bot) return;

  if (message.channel.id !== KEYDROP_CHANNEL_ID) return;

  // Expiration: expire active key randomly (5% chance)
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

  // Drop a new key (5% chance per message if none is active)
  if (!currentKey && Math.random() <= 0.05) {
    const rarity = getRandomRarity();
    currentKey = { rarity, channelId: message.channel.id, claimed: false };
    const dropEmbed = new EmbedBuilder()
      .setTitle('Key Dropped')
      .setDescription(`A **${rarity}** key dropped! Type \`.claim\` to claim it!`)
      .setColor('Green')
      .setTimestamp();
    message.channel.send({ embeds: [dropEmbed] });
  }
}

// Admin spawn key manually
async function spawnKey(rarity, channelId, client) {
  if (currentKey && !currentKey.claimed) {
    return { success: false, message: 'A key is already active!' };
  }

  currentKey = { rarity, channelId, claimed: false };
  const channel = client.channels.cache.get(channelId);
  
  if (channel) {
    const dropEmbed = new EmbedBuilder()
      .setTitle('🔑 Key Spawned by Admin!')
      .setDescription(`A **${rarity}** key has been spawned! Type \`.claim\` to claim it!`)
      .setColor('Gold')
      .setTimestamp();
    await channel.send({ embeds: [dropEmbed] });
  }

  return { success: true, message: `Spawned ${rarity} key in <#${channelId}>` };
}

async function claimKey(userId, addKeyToInventory) {
  if (currentKey && !currentKey.claimed) {
    await addKeyToInventory(userId, currentKey.rarity, 1);
    currentKey.claimed = true;
    currentKey = null;
    return true;
  }
  return false;
}

function getCurrentKey() {
  return currentKey;
}

module.exports = {
  handleKeyDrop,
  claimKey,
  getCurrentKey,
  spawnKey,
  getRandomRarity
};
