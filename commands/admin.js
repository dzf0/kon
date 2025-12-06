const { EmbedBuilder } = require('discord.js');

const ADMIN_ROLE_ID = '1382513369801555988'; // Replace with your admin role ID

const validRarities = [
  'Prismatic', 'Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'
];

function toProperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
  name: 'admin',
  description: 'Admin commands: give/remove currency or keys, reset user data, spawn keys.',
  async execute({ message, args, userData, saveUserData, getUserData, keydrop }) {
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Access Denied')
            .setDescription('Only admins can use admin commands.')
        ]
      });
    }

    if (args.length < 1) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Invalid Usage')
            .setDescription('Valid commands: give, remove, reset, spawn')
        ]
      });
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'give' || subcommand === 'remove') {
      const type = args[1]?.toLowerCase();
      if (!['currency', 'keys'].includes(type)) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('Invalid Type')
              .setDescription('Type must be either "currency" or "keys".')
          ]
        });
      }

      let rarityKey = null;
      let amountIndex = 2;

      if (type === 'keys') {
        const rarityArg = args[2];
        rarityKey = toProperCase(rarityArg);
        amountIndex++;
        if (!validRarities.includes(rarityKey)) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('Invalid Rarity')
                .setDescription(`Valid rarities: ${validRarities.join(', ')}`)
            ]
          });
        }
      }

      const amount = parseInt(args[amountIndex]);
      const userMention = message.mentions.users.first();

      if (!userMention || isNaN(amount) || amount <= 0) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('Invalid Arguments')
              .setDescription(`Usage: .admin ${subcommand} ${type}${type === 'keys' ? ' <rarity>' : ''} <amount> <@user>`)
          ]
        });
      }

      const userId = userMention.id;
      const targetData = await getUserData(userId);

      if (subcommand === 'give') {
        if (type === 'keys') {
          targetData.inventory = targetData.inventory || {};
          targetData.inventory[rarityKey] = (targetData.inventory[rarityKey] || 0) + amount;
          await saveUserData(userId, { inventory: targetData.inventory });
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('Keys Given')
                .setDescription(`Gave ${amount} ${rarityKey} key(s) to ${userMention.username}.`)
            ]
          });
        } else {
          targetData.balance = (targetData.balance || 0) + amount;
          await saveUserData(userId, { balance: targetData.balance });
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('Currency Added')
                .setDescription(`Added ${amount} coins to ${userMention.username}.`)
            ]
          });
        }
      } else { // remove
        if (type === 'keys') {
          targetData.inventory = targetData.inventory || {};
          if (!targetData.inventory[rarityKey] || targetData.inventory[rarityKey] < amount) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Insufficient Keys')
                  .setDescription(`${userMention.username} does not have enough ${rarityKey} key(s).`)
              ]
            });
          }
          targetData.inventory[rarityKey] -= amount;
          if (targetData.inventory[rarityKey] === 0) {
            delete targetData.inventory[rarityKey];
          }
          await saveUserData(userId, { inventory: targetData.inventory });
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Keys Removed')
                .setDescription(`Removed ${amount} ${rarityKey} key(s) from ${userMention.username}.`)
            ]
          });
        } else {
          if (targetData.balance < amount) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Insufficient Currency')
                  .setDescription(`${userMention.username} does not have enough coins.`)
              ]
            });
          }
          targetData.balance -= amount;
          await saveUserData(userId, { balance: targetData.balance });
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Currency Removed')
                .setDescription(`Removed ${amount} coins from ${userMention.username}.`)
            ]
          });
        }
      }
    } else if (subcommand === 'reset') {
      const userMention = message.mentions.users.first();
      if (!userMention) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('Invalid Usage')
              .setDescription('Usage: `.admin reset <@user>`')
          ]
        });
      }
      const userId = userMention.id;
      const targetData = await getUserData(userId);
      if (!targetData || (targetData.balance === 0 && Object.keys(targetData.inventory || {}).length === 0)) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('User Not Found')
              .setDescription(`No significant data found for user ${userMention.username}.`)
          ]
        });
      }
      // Reset to fresh state
      await saveUserData(userId, { balance: 0, inventory: {} });
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('User Data Reset')
            .setDescription(`Reset user data for ${userMention.username}.`)
        ]
      });
    } else if (subcommand === 'spawn') {
      // .admin spawn <rarity> <channel_id>
      const rarityArg = args[1];
      const channelId = args[2];

      if (!rarityArg || !channelId) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('Invalid Usage')
              .setDescription('Usage: `.admin spawn <rarity> <channel_id>`\nExample: `.admin spawn Legendary 1405349401945178152`\n\nValid rarities: ' + validRarities.join(', '))
          ]
        });
      }

      const rarityKey = toProperCase(rarityArg);

      if (!validRarities.includes(rarityKey)) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('Invalid Rarity')
              .setDescription(`Valid rarities: ${validRarities.join(', ')}`)
          ]
        });
      }

      // Check if channel exists
      const channel = message.client.channels.cache.get(channelId);
      if (!channel) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('Channel Not Found')
              .setDescription(`Channel with ID ${channelId} not found. Make sure the ID is correct.`)
          ]
        });
      }

      // Call spawnKey from keydrop.js
      try {
        const result = await keydrop.spawnKey(rarityKey, channelId, message.client);

        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(result.success ? 'Gold' : 'Red')
              .setTitle(result.success ? '🔑 Key Spawned' : '❌ Error')
              .setDescription(result.message)
          ]
        });
      } catch (error) {
        console.error('Error spawning key:', error);
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('Error')
              .setDescription('Failed to spawn key. Check console for details.')
          ]
        });
      }
    } else {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Invalid Command')
            .setDescription('Valid commands: give, remove, reset, spawn')
        ]
      });
    }
  }
};
