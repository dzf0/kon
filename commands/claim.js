const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'claim',
  description: 'Claim the currently dropped key.',
  async execute({ message, addKeyToInventory }) {
    // Get the current key from keydrop
    const currentKey = keydrop.getCurrentKey();

    if (currentKey && !currentKey.claimed) {
      // Claim the key and award to the user (async)
      const success = await keydrop.claimKey(message.author.id, addKeyToInventory);

      if (success) {
        const embed = new EmbedBuilder()
          .setTitle('🔑 Key Claimed!')
          .setDescription(`You claimed a **${currentKey.rarity}** key! Check your inventory with \`.inventory\`.`)
          .setColor('Green')
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      }
    } else {
      const embed = new EmbedBuilder()
        .setTitle('No Active Key')
        .setDescription('There is no key available to claim right now.')
        .setColor('Red')
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }
  }
};
