const { EmbedBuilder } = require('discord.js');

// Key rarities - must match your rarities list and chances
const rarities = [
  { name: 'Prismatic', chance: 0.01 },
  { name: 'Mythical', chance: 0.05 },
  { name: 'Legendary', chance: 0.10 },
  { name: 'Rare', chance: 0.20 },
  { name: 'Uncommon', chance: 0.30 },
  { name: 'Common', chance: 0.50 },
];

// Utility: get random rarity based on chance
function getRandomRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity.name;
  }
  return rarities[rarities.length - 1].name;
}

// Key drop state
let currentKey = null; // { rarity, channelId, claimed }

// Handle message for key drop expiration and new drops
async function handleKeyDrop(message, client) {
  if (message.author.bot) return;

  // Existing unclaimed key expires with 10% chance
  if (currentKey && !currentKey.claimed) {
    if (Math.random() <= 0.10) {
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

  // Drop a new key with 10% chance if none active
  if (!currentKey && Math.random() <= 0.10) {
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

// Claim the key if exists and not claimed
function claimKey(userId) {
  if (currentKey && !currentKey.claimed) {
    currentKey.claimed = true;
    currentKey.claimedBy = userId;
    return currentKey;
  }
  return null;
}

// Reset current key state, e.g. if needed
function resetKey() {
  currentKey = null;
}

module.exports = {
  handleKeyDrop,
  claimKey,
  resetKey,
};
