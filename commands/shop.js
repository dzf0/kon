const { EmbedBuilder } = require('discord.js');

const shopItems = [
  { id: 'silv_token', name: 'Silv token', price: 10000, emoji: '🔘', description: 'A shiny coin for exchanging robux and more!' },
  { id: 'common', name: 'Common key', price: 100, emoji: '🔑', description: 'gives kan' },
  { id: 'rare', name: 'Rare key', price: 500, emoji: '🗝', description: 'gives currency' },
  { id: 'regendary', name: 'Legendary key', price: 900, emoji: '🔑', description: 'gives currency' },
];

module.exports = {
  name: 'shop',
  description: 'View the shop and available items to buy',
  async execute({ message }) {
    const embed = new EmbedBuilder()
      .setTitle('🏪 Shop')
      .setDescription('Use `.buy <item_id> [quantity]` to purchase an item')
      .setColor('#FFD700')
      .setTimestamp();

    for (const item of shopItems) {
      embed.addFields({
        name: `${item.emoji} ${item.name}`,
        value: `**Price:** ${item.price} coins\n${item.description}\n**ID:** \`${item.id}\``,
        inline: false,
      });
    }

    message.channel.send({ embeds: [embed] });
  },
};
