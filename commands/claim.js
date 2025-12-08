const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'claim',
  description: 'Claim the currently dropped key.',
  async execute({ message, addKeyToInventory }) {
    // Read current key once
    const snapshotKey = keydrop.getCurrentKey(); // may be null

    // No key / already claimed / wrong channel → short reply, auto delete
    if (!snapshotKey || snapshotKey.claimed || snapshotKey.channelId !== message.channel.id) {
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

    // Ask keydrop to handle the claim (this will set claimed + add to inventory)
    const success = await keydrop.claimKey(message.author.id, addKeyToInventory);

    if (success) {
      // Use the snapshot’s rarity for the message; do NOT touch keydrop.currentKey
      const embed = new EmbedBuilder()
        .setTitle('🔑 Key Claimed!')
        .setDescription(
          `${message.author} claimed a **${snapshotKey.rarity}** key! Check your inventory with `.inventory`.`
        )
        .setColor('Green')
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } else {
      // Someone else claimed it in between
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
