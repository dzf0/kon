const { EmbedBuilder } = require('discord.js');

const shopItems = [
  { id: 'silv_token', name: 'Silv token', price: 10000, emoji: '🔘', description: 'A shiny coin for exchanging robux and more!' },
  { id: 'common', name: 'Common', price: 100, description: 'gives kan' },
  { id: 'rare', name: 'Rare', price: 500, description: 'gives currency' },
  { id: 'legendary', name: 'Legendary', price: 900, description: 'gives currency' },
];

module.exports = {
  name: 'buy',
  description: 'Buy an item from the shop',
  async execute({ message, args, userData, saveUserData }) {
    const itemIdInput = args[0]?.toLowerCase();
    let quantity = parseInt(args[1]) || 1;

    if (!itemIdInput) {
      return message.channel.send(
        'Usage: `.buy <item_id> [quantity]`\n' +
        'Example: `.buy common 2`\n' +
        'Use `.shop` to see all items.'
      );
    }

    if (quantity <= 0) {
      return message.channel.send('❌ Quantity must be at least 1.');
    }

    // Case-insensitive search
    const item = shopItems.find(i => i.id.toLowerCase() === itemIdInput);
    if (!item) {
      return message.channel.send(
        `❌ Item **${itemIdInput}** not found in shop.\nUse \`.shop\` to see available items.`
      );
    }

    const totalPrice = item.price * quantity;
    const currentBalance = userData.balance || 0;

    if (currentBalance < totalPrice) {
      const needed = totalPrice - currentBalance;
      return message.channel.send(
        `❌ Insufficient balance! You need **${needed}** more coins.\n` +
        `Your balance: **${currentBalance}** coins\n` +
        `Item price: **${totalPrice}** coins`
      );
    }

    // Deduct price
    userData.balance -= totalPrice;

    // Add to inventory
    userData.inventory = userData.inventory || {};
    userData.inventory[item.name] = (userData.inventory[item.name] || 0) + quantity;

    // Save to MongoDB
    await saveUserData({
      balance: userData.balance,
      inventory: userData.inventory,
    });

    const embed = new EmbedBuilder()
      .setTitle('✅ Purchase Complete')
      .setDescription(`You bought **${quantity}x ${item.emoji} ${item.name}**`)
      .addFields(
        { name: 'Price per Item', value: `${item.price} coins`, inline: true },
        { name: 'Total Price', value: `${totalPrice} coins`, inline: true },
        { name: 'Quantity', value: `${quantity}x`, inline: true },
        { name: 'New Balance', value: `${userData.balance} coins`, inline: false },
        { name: 'Total Owned', value: `${userData.inventory[item.name]}x`, inline: false }
      )
      .setColor('#00FF00')
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};
