const { EmbedBuilder } = require('discord.js');
const keydrop = require('./keydrop.js');

module.exports = {
  name: 'claim',
  description: 'Claim the currently dropped key.',
  async execute({ message, addKeyToInventory, keydrop }) {
    // Get the current key object from keydrop
    const currentKey = keydrop.getCurrentKey(); // expected: { rarity, channelId, claimed, ... }

    // If no key, already claimed, or in a different channel -> short reply, auto delete
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

    // Ask keydrop to process the claim and update MongoDB using addKeyToInventory
    const success = await keydrop.claimKey(message.author.id, addKeyToInventory);

    if (success) {
      // Mark as claimed in the in‑memory keydrop state
      currentKey.claimed = true;

      const embed = new EmbedBuilder()
        .setTitle('🔑 Key Claimed!')
        .setDescription(
          `${message.author} claimed a **${currentKey.rarity}** key! Check your inventory with `.inventory`.`
        )
        .setColor('Green')
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } else {
      // Another user likely claimed it between checks
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
