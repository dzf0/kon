const { EmbedBuilder } = require('discord.js');

const shopItems = [
  { id: 'silver_coin', name: 'silver_coin', price: 10000, emoji: '🪙', description: 'A shiny coin for exchanging robux and more!' },
  { id: 'invites', name: 'invites', price: 30000, emoji: '🎁', description: 'can be used to claim rewards in #invites' },
  { id: 'common_key', name: 'common_key', price: 500, emoji: '🔑', description: 'gives kan' },
  { id: 'rare_key', name: 'rare_key', price: 1500, emoji: '🗝️', description: 'gives currency' },
  { id: 'legendary_key', name: 'legendary_key', price: 2500, emoji: '🗝️', description: 'gives currency' },
];

module.exports = {
  name: 'buy',
  description: 'Buy an item from the shop',
  async execute({ message, args, userData, saveUserData }) {
    const itemId = args[0]?.toLowerCase();
    let quantity = parseInt(args[1]) || 1;

    if (!itemId) {
      return message.channel.send('Usage: `.buy <item_id> [quantity]' +
                                  'Example: `.buy common_key 2`' +
                                  'Use `.shop` to see all items.');
    }

    if (quantity <= 0) {
      return message.channel.send('❌ Quantity must be at least 1.');
    }

    // Find the item by ID
    const item = shopItems.find(i => i.id === itemId);

    if (!item) {
      return message.channel.send(
        `❌ Item **${itemId}** not found in shop.
Use `.shop` to see available items.`
      );
    }

    // Calculate total price
    const totalPrice = item.price * quantity;

    // Check balance
    if (typeof userData.balance !== 'number') userData.balance = 0;

    if (userData.balance < totalPrice) {
      const needed = totalPrice - userData.balance;
      return message.channel.send(
        `❌ Insufficient balance! You need **${needed}** more coins.
Your balance: **${userData.balance}** coins`
      );
    }

    // Deduct price
    userData.balance -= totalPrice;

    // Add to inventory
    userData.inventory = userData.inventory || {};
    userData.inventory[item.name] = (userData.inventory[item.name] || 0) + quantity;

    // Save to MongoDB
    await saveUserData(message.author.id, {
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

    message.channel.send({ embeds: [embed] });
  },
};
