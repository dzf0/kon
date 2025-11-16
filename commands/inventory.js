const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'inventory',
  description: 'Shows your inventory.',
  async execute({ message, userData }) {
    try {
      const userId = message.author.id;

      // Initialize user data if it doesn't exist
      if (!userData[userId]) {
        userData[userId] = { balance: 0, inventory: {} };
      }
      if (!userData[userId].inventory) {
        userData[userId].inventory = {};
      }

      const inventory = userData[userId].inventory;

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
