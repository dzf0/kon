const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'claim',
  description: 'Claim the currently dropped key.',
  async execute({ message, data, addKeyToInventory, saveUserData }) {
    const userId = message.author.id;

    if (keydrop.getCurrentKey() && !keydrop.getCurrentKey().claimed) {
      // Claim the key
      keydrop.claimKey(userId, data, addKeyToInventory, saveUserData);

      const embed = new EmbedBuilder()
        .setTitle('Key Claimed!')
        .setDescription(`You claimed a key! Check \`!inventory\`.`)
        .setColor('Green')
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
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
