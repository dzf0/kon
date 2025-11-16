const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'claim',
  description: 'Claim the dropped key',
  async execute({ message, currentKey, userData, saveUserData }) {
    try {
      if (!currentKey || !currentKey.rarity || currentKey.claimed) {
        const noKeyEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('No Active Key')
          .setDescription('There is no key available to claim right now.')
          .setTimestamp();
        await message.channel.send({ embeds: [noKeyEmbed] });
        return;
      }

      // Defensive user data init
      const userId = message.author.id;
      if (!userData[userId]) {
        userData[userId] = { balance: 0, inventory: {} };
      }
      if (!userData[userId].inventory) {
        userData[userId].inventory = {};
      }

      // Add key to user's inventory
      const rarityName = currentKey.rarity;
      userData[userId].inventory[rarityName] = (userData[userId].inventory[rarityName] || 0) + 1;

      // Mark key claimed
      currentKey.claimed = true;

      // Save user data persistently
      saveUserData();

      
      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Key Claimed')
        .setDescription(`${message.author} has claimed the **${rarityName}** key! 🎉`)
        .setTimestamp();

      await message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in claim command:', error);
      message.channel.send('❌ Something went wrong while trying to claim the key.');
    }
  },
};
