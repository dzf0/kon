const { EmbedBuilder } = require('discord.js');

const shopItems = [
  { id: 'lucky_coin', name: 'silver_coin', price: 10000, emoji: '🪙', description: 'A shiny coin for luck' },
  { id: 'mystery_box', name: 'invites', price: 30000, emoji: '🎁', description: 'Contains unknown treasure' },
  { id: 'golden_key', name: 'common_key', price: 500, emoji: '🔑', description: 'Opens special doors' },
  { id: 'diamond', name: 'rare_key', price: 1500, emoji: '🗝️', description: 'Valuable gem' },
  { id: 'crown', name: 'legendary_key', price: 2500, emoji: '🗝️', description: 'Symbol of power' },
];

module.exports = {
  name: 'shop',
  description: 'View the shop and available items to buy',
  async execute({ message }) {
    const embed = new EmbedBuilder()
      .setTitle('🏪 Shop')
      .setDescription('Use `.buy <item_id>` to purchase an item')
      .setColor('#FFD700')
      .setTimestamp();

    for (const item of shopItems) {
      embed.addFields({
        name: `${item.emoji} ${item.name}`,
        value: `**Price:** ${item.price} coins
${item.description}
**ID:** `${item.id}``,
        inline: false,
      });
    }

    message.channel.send({ embeds: [embed] });
  },
};


