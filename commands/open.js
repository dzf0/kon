const { EmbedBuilder } = require('discord.js');

const validRarities = [
  'Prismatic', 'Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'
];

// Per‑rarity reward ranges (tuned to cap total at 2000)
const rarityRewards = {
  Prismatic: { min: 800, max: 2000 },
  Mythical:  { min: 500, max: 1500 },
  Legendary: { min: 300, max: 1000 },
  Rare:      { min: 150, max: 600 },
  Uncommon:  { min: 75,  max: 300 },
  Common:    { min: 25,  max: 150 }
};

// Helper: Converts any input to ProperCase for standardized key names
function toProperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
  name: 'open',
  description: 'Open one or more keys of the given rarity to receive prizes.',
  async execute({ message, args, userData, saveUserData }) {
    try {
      const rarityArg = args[0];
      if (!rarityArg) {
        return message.channel.send('Please specify a key rarity to open (e.g. `.open Rare`).');
      }
      const rarityKey = toProperCase(rarityArg);

      if (!validRarities.includes(rarityKey)) {
        return message.channel.send('Invalid key rarity specified.');
      }

      let amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) amount = 1;

      // userData is already loaded from MongoDB by index.js
      if (!userData || typeof userData !== 'object') {
        return message.channel.send('Bot error: user data is not available.');
      }
      if (!userData.inventory || typeof userData.inventory !== 'object') {
        userData.inventory = {};
      }
      if (typeof userData.inventory[rarityKey] !== 'number') {
        userData.inventory[rarityKey] = 0;
      }

      const currentAmount = userData.inventory[rarityKey];
      if (currentAmount < amount) {
        return message.channel.send(
          `You do not have enough **${rarityKey}** keys to open (**${amount}** requested, you have **${currentAmount}**).`
        );
      }

      // Get rarity-based reward range
      const { min, max } = rarityRewards[rarityKey] || { min: 10, max: 100 };

      let totalReward = 0;
      for (let i = 0; i < amount; i++) {
        const roll = Math.floor(Math.random() * (max - min + 1)) + min;
        totalReward += roll;
      }

      // Hard cap: 2000 coins per open command
      if (totalReward > 2000) totalReward = 2000;

      userData.inventory[rarityKey] -= amount;
      userData.balance = (userData.balance || 0) + totalReward;

      // Persist to MongoDB
      await saveUserData({
        inventory: userData.inventory,
        balance: userData.balance,
      });

      const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('Keys Opened!')
        .setDescription(
          `${message.author} opened **${amount} ${rarityKey}** ` +
          `key${amount > 1 ? 's' : ''} and received **${totalReward} coins**!`
        )
        .addFields(
          { name: 'Keys left', value: `${userData.inventory[rarityKey]}`, inline: true },
          { name: 'New Balance', value: `${userData.balance} coins`, inline: true }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in open command:', error);
      message.channel.send('❌ Something went wrong while opening your key(s).');
    }
  }
};
