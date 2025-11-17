const { EmbedBuilder } = require('discord.js');

const validRarities = [
  'Prismatic', 'Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'
];

// Utility function: standardize rarity to format used for inventory keys
function toProperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
  name: 'open',
  description: 'Open one or more keys of the given rarity to receive prizes.',
  async execute({ message, args, userData, saveUserData }) {
    try {
      // === Parse Arguments ===
      const rarityArg = args[0];
      if (!rarityArg) {
        return message.channel.send('Please specify a key rarity to open (e.g. `!open Rare`).');
      }
      // Standardize and validate
      const rarityKey = toProperCase(rarityArg);
      const isValidRarity = validRarities.some(
        r => r.toLowerCase() === rarityKey.toLowerCase()
      );
      if (!isValidRarity) {
        return message.channel.send('Invalid key rarity specified.');
      }
      // Parse amount, default to 1
      let amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) amount = 1;

      // === Defensive User Data Checks ===
      const userId = message.author.id;
      if (!userData || typeof userData !== 'object') {
        return message.channel.send('Bot error: user data is not available.');
      }
      if (!userData[userId] || typeof userData[userId] !== 'object') {
        userData[userId] = { balance: 0, inventory: {} };
      }
      if (!userData[userId].inventory || typeof userData[userId].inventory !== 'object') {
        userData[userId].inventory = {};
      }
      if (typeof userData[userId].inventory[rarityKey] !== 'number') {
        userData[userId].inventory[rarityKey] = 0;
      }

      // === Does User Have Enough Keys? ===
      const currentAmount = userData[userId].inventory[rarityKey];
      if (currentAmount < amount) {
        return message.channel.send(`You do not have enough **${rarityKey}** keys to open (**${amount}** requested, you have **${currentAmount}**).`);
      }

      // === Open Keys, Give Rewards ===
      let totalReward = 0;
      const minReward = 10, maxReward = 100;
      for (let i = 0; i < amount; i++) {
        totalReward += Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
      }

      userData[userId].inventory[rarityKey] -= amount;
      userData[userId].balance += totalReward;
      saveUserData();

      const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('Keys Opened!')
        .setDescription(`${message.author} opened **${amount} ${rarityKey}** key${amount > 1 ? 's' : ''} and received **${totalReward} coins**!`)
        .addFields(
          { name: 'Keys left', value: `${userData[userId].inventory[rarityKey]}`, inline: true },
          { name: 'New Balance', value: `${userData[userId].balance} coins`, inline: true }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in open command:', error);
      message.channel.send('❌ Something went wrong while opening your key(s).');
    }
  }
};
