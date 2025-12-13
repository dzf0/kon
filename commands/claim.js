const { EmbedBuilder } = require('discord.js');

const rewardsByRarity = {
  Prismatic: { min: 500, max: 1000 },
  Mythical:  { min: 300, max: 600 },
  Legendary: { min: 200, max: 400 },
  Rare:      { min: 100, max: 200 },
  Uncommon:  { min: 50,  max: 100 },
  Common:    { min: 10,  max: 50 },
};

module.exports = {
  name: 'redeem',
  description: 'Redeem keys from your inventory for coins',
  async execute({ message, args, userData, saveUserData }) {
    const keyName = args.slice(0, -1).join(' ').trim(); // Everything except last arg
    const amount = parseInt(args[args.length - 1]) || 1; // Last arg is amount

    if (!keyName || amount < 1) {
      return message.channel.send('Usage: `.redeem <key name> [amount]`\nExample: `.redeem Common 5`');
    }

    const inventory = userData.inventory || {};

    // Find the key (case-insensitive)
    const actualKeyName = Object.keys(inventory).find(
      key => key.toLowerCase().trim() === keyName.toLowerCase().trim()
    );

    if (!actualKeyName) {
      return message.channel.send(`❌ You don't have any **${keyName}** keys!`);
    }

    const userKeyCount = inventory[actualKeyName] || 0;

    if (userKeyCount < amount) {
      return message.channel.send(
        `❌ You only have **${userKeyCount} ${actualKeyName}** key(s), but tried to redeem **${amount}**.`
      );
    }

    // Calculate total reward
    let totalCoins = 0;
    const rewardRange = rewardsByRarity[actualKeyName] || { min: 10, max: 50 };

    for (let i = 0; i < amount; i++) {
      const reward = Math.floor(Math.random() * (rewardRange.max - rewardRange.min + 1)) + rewardRange.min;
      totalCoins += reward;
    }

    // IMPORTANT: Update inventory FIRST (remove keys)
    inventory[actualKeyName] = userKeyCount - amount;
    
    // Clean up zero entries
    if (inventory[actualKeyName] === 0) {
      delete inventory[actualKeyName];
    }

    // IMPORTANT: Update balance (add coins)
    userData.balance = (userData.balance || 0) + totalCoins;

    // IMPORTANT: Save BOTH changes together
    await saveUserData({
      balance: userData.balance,
      inventory: userData.inventory
    });

    const embed = new EmbedBuilder()
      .setTitle('💰 Keys Redeemed!')
      .setDescription(
        `You redeemed **${amount} ${actualKeyName}** key(s)!\n\n` +
        `**Earned:** +${totalCoins} coins\n` +
        `**New Balance:** ${userData.balance} coins`
      )
      .setColor('#00FF00')
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};
