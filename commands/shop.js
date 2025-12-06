const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shop',
  description: 'Display the shop items.',
  async execute({ message }) {
    // Example shop items; adapt as needed
    const shopItems = [
      { name: 'Common Key', price: 50, description: 'A basic key for chests' },
      { name: 'Rare Key', price: 200, description: 'A key with better loot chances' },
      { name: 'Legendary Key', price: 500, description: 'High-tier key, very rare rewards' },
      { name: 'Mythical Sword', price: 1000, description: 'A powerful sword with special effects' },
    ];

    const embed = new EmbedBuilder()
      .setTitle('🛒 Shop')
      .setColor('#00BFFF')
      .setDescription('Browse the items you can buy with your currency.\nUse `.buy <item name> <amount>` to purchase.')
      .setTimestamp();

    for (const item of shopItems) {
      embed.addFields({
        name: `${item.name} - ${item.price} 𝓚𝓪𝓷`,
        value: item.description,
        inline: false,
      });
    }

    message.channel.send({ embeds: [embed] });
  },
};
