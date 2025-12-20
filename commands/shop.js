const { EmbedBuilder } = require('discord.js');

const shopItems = [
  { id: 'silv_token', name: 'Silv token', price: 10000, emoji: '<:SILV_TOKEN:1447678878448484555>', description: 'A shiny coin for exchanging robux and more!' },
  { id: 'common', name: 'Common key', price: 100, emoji: '🔑', description: 'A humble key blessed with a small fortune.' },
  { id: 'rare', name: 'Rare key', price: 500, emoji: '🗝', description: 'A radiant key imbued with wealth and fortune.' },
  { id: 'legendary', name: 'Legendary key', price: 900, emoji: '🔑', description: 'A divine key said to give wealth far beyond imagination' },
];

module.exports = {
  name: 'shop',
  description: 'View the shop and available items to buy',
  async execute({ message }) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚ · 𐙚  Heavenly Emporium 𐙚 · ˚✧')
      .setDescription(
        [
          '˗ˏˋ 𓏲࿐₊˚ෆ A little market above the clouds ෆ˚₊࿐𓏲 ˎˊ˗',
          '',
          'Use `.buy <item_id> [quantity]` to trade coins for **celestial trinkets**.',
        ].join('\n')
      )
      .setColor('#F5E6FF') // soft angelic pastel[web:155]
      .setFooter({ text: '₊˚ෆ guided by soft wings and starlight ෆ˚₊' })
      .setTimestamp();

    // soft category header
    embed.addFields({
      name: '✧ ˚｡⋆ Available Blessings ⋆｡˚ ✧',
      value: 'pick something pretty for your soul ↓',
      inline: false,
    });

    for (const item of shopItems) {
      embed.addFields({
        name: `૮₍ ${item.emoji} ₎ა  ${item.name}`,
        value:
          [
            `·ೃ✧ **Price:** \`${item.price.toLocaleString()} coins\``,
            `·ೃ✧ **ID:** \`${item.id}\``,
            `·ೃ✧ *${item.description}*`,
            '꒰ ✧ softly wrapped in moonlight ✧ ꒱',
          ].join('\n'),
        inline: false,
      });
    }

    return message.channel.send({ embeds: [embed] });
  },
};
