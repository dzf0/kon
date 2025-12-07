const { EmbedBuilder } = require('discord.js');

const KEYDROP_CHANNEL_ID = '1401925188991582338';

let currentKey = null;

// Rarity chances are *within* the 5% overall drop rate
const rarities = [
  { name: 'Prismatic', chance: 0.0001 },
  { name: 'Mythical',  chance: 0.001 },
  { name: 'Legendary', chance: 0.01  },
  { name: 'Rare',      chance: 0.03  },
  { name: 'Uncommon',  chance: 0.05  },
  { name: 'Common',    chance: 0.10  },
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

  // Only drop in the keydrop channel
  if (message.channel.id !== KEYDROP_CHANNEL_ID) return;

  // Chance to expire an existing unclaimed key
  if (currentKey && !currentKey.claimed) {
    if (Math.random() <= 0.03) {
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

  // 5% chance per message to spawn a new key if none active
  if (!currentKey && Math.random() <= 0.025) {
    const rarity = getRandomRarity();
    currentKey = {
      rarity, // string like "Legendary"
      channelId: message.channel.id,
      claimed: false,
      spawnedBy: 'auto',
    };

    const dropEmbed = new EmbedBuilder()
      .setTitle('Key Dropped')
      .setDescription(`A **${rarity}** key dropped! Type `.claim` to claim it!`)
      .setColor('Green')
      .setTimestamp();
    await message.channel.send({ embeds: [dropEmbed] });
  }
}

async function spawnKey(rarity, channelId, client) {
  // rarity is a STRING like "Legendary"
  if (currentKey && !currentKey.claimed) {
    return {
      success: false,
      message: 'There is already an active key. Wait until it is claimed or expires.',
    };
  }

  currentKey = { rarity, channelId, claimed: false };

  const channel = client.channels.cache.get(channelId);
  if (channel) {
    const dropEmbed = new EmbedBuilder()
      .setTitle('Key Spawned by Admin')
      .setDescription(`An **${rarity}** key has been spawned! Type `.claim` to claim it!`)
      .setColor('Gold')
      .setTimestamp();

    await channel.send({ embeds: [dropEmbed] });
  }

  return { success: true, message: `Spawned **${rarity}** key in <#${channelId}>` };
}

async function claimKey(userId, addKeyToInventory) {
  if (!currentKey || currentKey.claimed) return false;

  await addKeyToInventory(userId, currentKey.rarity, 1);
  currentKey.claimed = true;
  currentKey = null;
  return true;
}

function getCurrentKey() {
  return currentKey;
}

module.exports = {
  handleKeyDrop,
  spawnKey,
  claimKey,
  getCurrentKey,
  getRandomRarity,
};
