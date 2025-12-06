const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'inventory',
  description: 'Shows your inventory.',
  async execute({ message, userData }) {
    try {
      // userData is already loaded from MongoDB by index.js
      if (!userData.inventory || typeof userData.inventory !== 'object') {
        userData.inventory = {};
      }

      const inventory = userData.inventory;

      if (Object.keys(inventory).length === 0) {
        return message.channel.send('Your inventory is empty.');
      }

      // Build inventory string
      let inventoryList = '';
      for (const [item, amount] of Object.entries(inventory)) {
        inventoryList += `**${item}**: ${amount}\n`;
      }

      // Create embed message
      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Inventory`)
        .setDescription(inventoryList)
        .setColor('#0099ff')
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error executing inventory command:', error);
      message.channel.send('❌ There was an error displaying your inventory.');
    }
  },
};
