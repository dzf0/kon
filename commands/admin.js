const { EmbedBuilder } = require('discord.js');

const ADMIN_ROLE_ID = '1439504588318314496'; // Replace with your admin role ID

const validRarities = [
  'Prismatic', 'Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'
];

function toProperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
  name: 'admin',
  description: 'Admin commands: give/remove currency or keys, reset user data.',
  async execute({ message, args, userData, saveUserData }) {
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
            .setDescription('Valid commands: give, remove, reset')
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
              .setDescription(`Usage: !admin ${subcommand} ${type}${type === 'keys' ? ' <rarity>' : ''} <amount> <@user>`)
          ]
        });
      }

      const userId = userMention.id;

      if (!userData[userId] || typeof userData[userId] !== 'object') userData[userId] = { balance: 0, inventory: {} };
      if (!userData[userId].inventory || typeof userData[userId].inventory !== 'object') userData[userId].inventory = {};
      if (typeof userData[userId].balance !== 'number') userData[userId].balance = 0;

      if (subcommand === 'give') {
        if (type === 'keys') {
          userData[userId].inventory[rarityKey] = (userData[userId].inventory[rarityKey] || 0) + amount;
          saveUserData();
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('Keys Given')
                .setDescription(`Gave ${amount} ${rarityKey} key(s) to ${userMention.username}.`)
            ]
          });
        } else {
          userData[userId].balance += amount;
          saveUserData();
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('Currency Added')
                .setDescription(`Added ${amount} 𝓚𝓪𝓷 to ${userMention.username}.`)
            ]
          });
        }
      } else { // remove
        if (type === 'keys') {
          if (!userData[userId].inventory[rarityKey] || userData[userId].inventory[rarityKey] < amount) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Insufficient Keys')
                  .setDescription(`${userMention.username} does not have enough ${rarityKey} key(s).`)
              ]
            });
          }
          userData[userId].inventory[rarityKey] -= amount;
          if (userData[userId].inventory[rarityKey] === 0) {
            delete userData[userId].inventory[rarityKey];
          }
          saveUserData();
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Keys Removed')
                .setDescription(`Removed ${amount} ${rarityKey} key(s) from ${userMention.username}.`)
            ]
          });
        } else {
          if (userData[userId].balance < amount) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Insufficient Currency')
                  .setDescription(`${userMention.username} does not have enough 𝓚𝓪𝓷.`)
              ]
            });
          }
          userData[userId].balance -= amount;
          saveUserData();
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Currency Removed')
                .setDescription(`Removed ${amount} 𝓚𝓪𝓷 from ${userMention.username}.`)
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
              .setDescription('Usage: !admin reset <@user>')
          ]
        });
      }
      const userId = userMention.id;
      if (!userData[userId]) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('User Not Found')
              .setDescription(`No data found for user ${userMention.username}.`)
          ]
        });
      }
      delete userData[userId];
      saveUserData();
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('User Data Reset')
            .setDescription(`Reset user data for ${userMention.username}.`)
        ]
      });
    } else {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Invalid Command')
            .setDescription('Valid commands: give, remove, reset')
        ]
      });
    }
  }
};
