const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'redeem',
  description: 'Claim the currently dropped key.',
  async execute({ message, addKeyToInventory, keydrop }) {
    // Get the current key from keydrop (should be { rarity, channelId, claimed, ... })
    const currentKey = keydrop.getCurrentKey();

    // No key, already claimed, or claimed in another channel
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

      // Delete only this user’s reply after 5 seconds
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);

      return;
    }

    // Try to claim via keydrop module; this should also update MongoDB using addKeyToInventory
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
      // Edge case: another user sniped between the checks
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
