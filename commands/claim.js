const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'claim',
  description: 'Claim the currently dropped key.',
  async execute({ message, addKeyToInventory }) {
    const currentKey = keydrop.getCurrentKey(); // may be null

    // No key / already claimed / wrong channel
    if (!currentKey || currentKey.claimed || currentKey.channelId !== message.channel.id) {
      const reply = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('No Active Key')
            .setDescription('There is no key available to claim right now, or it has already been claimed.')
            .setColor('Red')
            .setTimestamp(),
        ],
      });

      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);

      return;
    }

    // Try to claim via keydrop (this also adds to MongoDB)
    const success = await keydrop.claimKey(message.author.id, addKeyToInventory);

    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('🔑 Key Claimed!')
        .setDescription(
          `${message.author} claimed a **${currentKey.rarity}** key! Check your inventory with `.inventory`.`
        )
        .setColor('Green')
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } else {
      // Race condition: someone else got it
      const reply = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Too Late!')
            .setDescription('That key has already been claimed.')
            .setColor('Red')
            .setTimestamp(),
        ],
      });

      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);
    }
  },
};
