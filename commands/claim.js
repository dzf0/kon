const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'claim',
  description: 'Claim the currently dropped key.',
  async execute({ message, addKeyToInventory }) {
    // keydrop.js shared state: may be null
    const currentKey = keydrop.getCurrentKey();

    // No key, already claimed, or different channel
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

    // Use keydrop.claimKey(userId, addKeyToInventory) exactly as defined in keydrop.js
    const success = await keydrop.claimKey(message.author.id, addKeyToInventory);

    if (success) {
      // currentKey was valid when we read it; claimKey() has now added the key and nulled the global
      const embed = new EmbedBuilder()
        .setTitle('🔑 Key Claimed!')
        .setDescription(
          `${message.author} claimed a **${currentKey.rarity}** key! Check your inventory with `.inventory`.`
        )
        .setColor('Green')
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } else {
      // Safety: if claimKey() returned false (e.g. race condition)
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
