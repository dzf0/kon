const { EmbedBuilder } = require('discord.js');

// Track active trades: key = userId, value = tradeState
const activeTrades = new Map();

// Helper function to find item in inventory (case-insensitive)
function findInventoryItem(inventory, itemName) {
  if (!inventory) return null;
  const lowerName = itemName.toLowerCase();
  for (const key of Object.keys(inventory)) {
    if (key.toLowerCase() === lowerName) {
      return key; // Return actual key from inventory
    }
  }
  return null;
}

module.exports = {
  name: 'trade',
  description: 'Trade items and currency with other users',
  async execute({ message, args, userData, saveUserData, getUserData, client }) {
    const sub = (args[0] || '').toLowerCase();
    const userId = message.author.id;

    // START TRADE - check if first arg is a mention OR if sub is 'start'
    const targetUser = message.mentions.users.first();
    
    if (targetUser || sub === 'start') {
      if (!targetUser) {
        return message.channel.send('Usage: `.trade @user` to start a trade');
      }

      if (targetUser.bot) {
        return message.channel.send('❌ You cannot trade with bots!');
      }

      if (targetUser.id === userId) {
        return message.channel.send('❌ You cannot trade with yourself!');
      }

      if (activeTrades.has(userId)) {
        return message.channel.send('❌ You already have an active trade! Finish or cancel it first.');
      }

      if (activeTrades.has(targetUser.id)) {
        return message.channel.send('❌ That user already has an active trade!');
      }

      // Create trade session
      activeTrades.set(userId, {
        initiator: userId,
        partner: targetUser.id,
        channelId: message.channel.id,
        initiatorOffer: { currency: 0, items: {} },
        partnerOffer: { currency: 0, items: {} },
        initiatorConfirmed: false,
        partnerConfirmed: false,
        status: 'open'
      });

      activeTrades.set(targetUser.id, activeTrades.get(userId));

      const embed = new EmbedBuilder()
        .setTitle('🤝 Trade Initiated')
        .setDescription(
          `${message.author} wants to trade with ${targetUser}!\n\n` +
          `**Commands:**\n` +
          `\`.trade offer currency <amount>\` - Offer coins\n` +
          `\`.trade offer item <item_name> <amount>\` - Offer inventory items\n` +
          `\`.trade remove currency <amount>\` - Remove coins from offer\n` +
          `\`.trade remove item <item_name> <amount>\` - Remove items from offer\n` +
          `\`.trade view\` - View current offers\n` +
          `\`.trade confirm\` - Confirm your side\n` +
          `\`.trade cancel\` - Cancel trade`
        )
        .setColor('#FFD700')
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // Check if user has active trade
    const trade = activeTrades.get(userId);
    if (!trade) {
      return message.channel.send('❌ You don\'t have an active trade. Use `.trade @user` to start one.');
    }

    // OFFER CURRENCY OR ITEMS
    if (sub === 'offer') {
      const offerType = args[1]?.toLowerCase();
      
      if (offerType === 'currency') {
        const amount = parseInt(args[2]);
        
        if (isNaN(amount) || amount <= 0) {
          return message.channel.send('❌ Please specify a valid positive amount.');
        }

        if (userData.balance < amount) {
          return message.channel.send(`❌ You don't have ${amount} coins! Your balance: ${userData.balance}`);
        }

        const isInitiator = userId === trade.initiator;
        const offer = isInitiator ? trade.initiatorOffer : trade.partnerOffer;
        
        offer.currency += amount;

        // Reset confirmations
        trade.initiatorConfirmed = false;
        trade.partnerConfirmed = false;

        return message.channel.send(`✅ Added **${amount}** coins to your offer. Total: **${offer.currency}** coins`);
      }

      if (offerType === 'item') {
        const itemNameInput = args[2];
        const amount = parseInt(args[3]);

        if (!itemNameInput || isNaN(amount) || amount <= 0) {
          return message.channel.send('Usage: `.trade offer item <item_name> <amount>`');
        }

        // Find actual item name in inventory (case-insensitive)
        const actualItemName = findInventoryItem(userData.inventory, itemNameInput);
        
        if (!actualItemName) {
          return message.channel.send(`❌ You don't have any item called **${itemNameInput}** in your inventory.`);
        }

        const userItems = userData.inventory[actualItemName] || 0;
        const isInitiator = userId === trade.initiator;
        const offer = isInitiator ? trade.initiatorOffer : trade.partnerOffer;
        const alreadyOffered = offer.items[actualItemName] || 0;

        if (userItems < alreadyOffered + amount) {
          return message.channel.send(
            `❌ You don't have enough **${actualItemName}**! ` +
            `You have: ${userItems}, Already offered: ${alreadyOffered}`
          );
        }

        offer.items[actualItemName] = alreadyOffered + amount;

        // Reset confirmations
        trade.initiatorConfirmed = false;
        trade.partnerConfirmed = false;

        return message.channel.send(
          `✅ Added **${amount} ${actualItemName}** to your offer. Total: **${offer.items[actualItemName]}**`
        );
      }

      return message.channel.send('Usage: `.trade offer currency <amount>` or `.trade offer item <item_name> <amount>`');
    }

    // REMOVE FROM OFFER
    if (sub === 'remove') {
      const removeType = args[1]?.toLowerCase();
      
      if (removeType === 'currency') {
        const amount = parseInt(args[2]);
        
        if (isNaN(amount) || amount <= 0) {
          return message.channel.send('❌ Please specify a valid positive amount.');
        }

        const isInitiator = userId === trade.initiator;
        const offer = isInitiator ? trade.initiatorOffer : trade.partnerOffer;
        
        if (offer.currency < amount) {
          return message.channel.send(`❌ You only offered ${offer.currency} coins.`);
        }

        offer.currency -= amount;

        // Reset confirmations
        trade.initiatorConfirmed = false;
        trade.partnerConfirmed = false;

        return message.channel.send(`✅ Removed **${amount}** coins from your offer. Remaining: **${offer.currency}** coins`);
      }

      if (removeType === 'item') {
        const itemNameInput = args[2];
        const amount = parseInt(args[3]);

        if (!itemNameInput || isNaN(amount) || amount <= 0) {
          return message.channel.send('Usage: `.trade remove item <item_name> <amount>`');
        }

        const isInitiator = userId === trade.initiator;
        const offer = isInitiator ? trade.initiatorOffer : trade.partnerOffer;

        // Find actual item name in offer (case-insensitive)
        const lowerInput = itemNameInput.toLowerCase();
        let actualItemName = null;
        for (const key of Object.keys(offer.items)) {
          if (key.toLowerCase() === lowerInput) {
            actualItemName = key;
            break;
          }
        }

        if (!actualItemName) {
          return message.channel.send(`❌ You haven't offered any **${itemNameInput}**.`);
        }

        const offered = offer.items[actualItemName] || 0;

        if (offered < amount) {
          return message.channel.send(`❌ You only offered ${offered} ${actualItemName}.`);
        }

        offer.items[actualItemName] = offered - amount;
        if (offer.items[actualItemName] === 0) {
          delete offer.items[actualItemName];
        }

        // Reset confirmations
        trade.initiatorConfirmed = false;
        trade.partnerConfirmed = false;

        return message.channel.send(`✅ Removed **${amount} ${actualItemName}** from your offer.`);
      }

      return message.channel.send('Usage: `.trade remove currency <amount>` or `.trade remove item <item_name> <amount>`');
    }

    // VIEW TRADE
    if (sub === 'view') {
      const initiator = await client.users.fetch(trade.initiator);
      const partner = await client.users.fetch(trade.partner);

      const initiatorItems = Object.entries(trade.initiatorOffer.items)
        .map(([k, v]) => `${v}x ${k}`)
        .join(', ') || 'None';
      
      const partnerItems = Object.entries(trade.partnerOffer.items)
        .map(([k, v]) => `${v}x ${k}`)
        .join(', ') || 'None';

      const embed = new EmbedBuilder()
        .setTitle('🤝 Current Trade Offers')
        .addFields(
          {
            name: `${initiator.username}'s Offer ${trade.initiatorConfirmed ? '✅' : '❌'}`,
            value: `**Currency:** ${trade.initiatorOffer.currency} coins\n**Items:** ${initiatorItems}`,
            inline: false
          },
          {
            name: `${partner.username}'s Offer ${trade.partnerConfirmed ? '✅' : '❌'}`,
            value: `**Currency:** ${trade.partnerOffer.currency} coins\n**Items:** ${partnerItems}`,
            inline: false
          }
        )
        .setDescription('Both parties must confirm with `.trade confirm` to complete the trade.')
        .setColor('#FFD700')
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // CONFIRM TRADE
    if (sub === 'confirm') {
      const isInitiator = userId === trade.initiator;
      
      if (isInitiator) {
        trade.initiatorConfirmed = true;
      } else {
        trade.partnerConfirmed = true;
      }

      if (!trade.initiatorConfirmed || !trade.partnerConfirmed) {
        return message.channel.send(`✅ ${message.author.username} confirmed! Waiting for other party...`);
      }

      // Both confirmed - execute trade
      const initiatorData = await getUserData(trade.initiator);
      const partnerData = await getUserData(trade.partner);

      // Validate both users still have what they offered
      if (initiatorData.balance < trade.initiatorOffer.currency) {
        activeTrades.delete(trade.initiator);
        activeTrades.delete(trade.partner);
        return message.channel.send('❌ Trade failed! Initiator doesn\'t have enough currency.');
      }

      if (partnerData.balance < trade.partnerOffer.currency) {
        activeTrades.delete(trade.initiator);
        activeTrades.delete(trade.partner);
        return message.channel.send('❌ Trade failed! Partner doesn\'t have enough currency.');
      }

      // Validate items
      for (const [itemName, amount] of Object.entries(trade.initiatorOffer.items)) {
        if ((initiatorData.inventory?.[itemName] || 0) < amount) {
          activeTrades.delete(trade.initiator);
          activeTrades.delete(trade.partner);
          return message.channel.send(`❌ Trade failed! Initiator doesn't have enough ${itemName}.`);
        }
      }

      for (const [itemName, amount] of Object.entries(trade.partnerOffer.items)) {
        if ((partnerData.inventory?.[itemName] || 0) < amount) {
          activeTrades.delete(trade.initiator);
          activeTrades.delete(trade.partner);
          return message.channel.send(`❌ Trade failed! Partner doesn't have enough ${itemName}.`);
        }
      }

      // Execute trade - update inventories and balances
      initiatorData.inventory = initiatorData.inventory || {};
      partnerData.inventory = partnerData.inventory || {};

      // Transfer currency
      initiatorData.balance -= trade.initiatorOffer.currency;
      initiatorData.balance += trade.partnerOffer.currency;
      
      partnerData.balance -= trade.partnerOffer.currency;
      partnerData.balance += trade.initiatorOffer.currency;

      // Transfer items from initiator to partner
      for (const [itemName, amount] of Object.entries(trade.initiatorOffer.items)) {
        initiatorData.inventory[itemName] = (initiatorData.inventory[itemName] || 0) - amount;
        partnerData.inventory[itemName] = (partnerData.inventory[itemName] || 0) + amount;
      }

      // Transfer items from partner to initiator
      for (const [itemName, amount] of Object.entries(trade.partnerOffer.items)) {
        partnerData.inventory[itemName] = (partnerData.inventory[itemName] || 0) - amount;
        initiatorData.inventory[itemName] = (initiatorData.inventory[itemName] || 0) + amount;
      }

      // Clean up zero entries
      for (const inv of [initiatorData.inventory, partnerData.inventory]) {
        for (const key in inv) {
          if (inv[key] === 0) delete inv[key];
        }
      }

      // Save to database - use appropriate method based on who is calling
      if (userId === trade.initiator) {
        await saveUserData({
          balance: initiatorData.balance,
          inventory: initiatorData.inventory
        });
        // Use MongoDB helper for partner
        const User = require('mongoose').model('User');
        await User.updateOne(
          { userId: trade.partner },
          { $set: { balance: partnerData.balance, inventory: partnerData.inventory } }
        );
      } else {
        await saveUserData({
          balance: partnerData.balance,
          inventory: partnerData.inventory
        });
        // Use MongoDB helper for initiator
        const User = require('mongoose').model('User');
        await User.updateOne(
          { userId: trade.initiator },
          { $set: { balance: initiatorData.balance, inventory: initiatorData.inventory } }
        );
      }

      const initiator = await client.users.fetch(trade.initiator);
      const partner = await client.users.fetch(trade.partner);

      const embed = new EmbedBuilder()
        .setTitle('✅ Trade Completed!')
        .setDescription(`Trade between ${initiator} and ${partner} completed successfully!`)
        .setColor('#00FF00')
        .setTimestamp();

      message.channel.send({ embeds: [embed] });

      activeTrades.delete(trade.initiator);
      activeTrades.delete(trade.partner);
      return;
    }

    // CANCEL TRADE
    if (sub === 'cancel') {
      const initiator = await client.users.fetch(trade.initiator);
      const partner = await client.users.fetch(trade.partner);

      activeTrades.delete(trade.initiator);
      activeTrades.delete(trade.partner);

      const embed = new EmbedBuilder()
        .setTitle('❌ Trade Cancelled')
        .setDescription(`Trade between ${initiator} and ${partner} was cancelled.`)
        .setColor('#FF0000')
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // Default help
    return message.channel.send(
      '**Trade Commands:**\n' +
      '`.trade @user` - Start trade\n' +
      '`.trade offer currency <amount>` - Offer coins\n' +
      '`.trade offer item <item_name> <amount>` - Offer any inventory item\n' +
      '`.trade remove currency <amount>` - Remove coins\n' +
      '`.trade remove item <item_name> <amount>` - Remove items\n' +
      '`.trade view` - View offers\n' +
      '`.trade confirm` - Confirm trade\n' +
      '`.trade cancel` - Cancel trade'
    );
  }
};
