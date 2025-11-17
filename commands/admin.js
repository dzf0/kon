const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = './data.json'; // data file path

const ADMIN_ROLE_ID = '1439504588318314496'; // Replace with your actual admin role ID

const rarities = [
  { name: 'Prismatic', chance: 0.01 },
  { name: 'Mythical', chance: 0.05 },
  { name: 'Legendary', chance: 0.10 },
  { name: 'Rare', chance: 0.20 },
  { name: 'Uncommon', chance: 0.30 },
  { name: 'Common', chance: 0.50 },
];

// Lowercase rarity names for case-insensitive validation
const validRaritiesLower = rarities.map(r => r.name.toLowerCase());

function loadUserData() {
  try {
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load user data:', e);
  }
  return {};
}

function saveUserData(data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}

module.exports = {
  name: 'admin',
  description: 'Admin commands: give/remove currency or keys, reset user data.',
  async execute({ message, args }) {
    // Check if the user has admin role
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
    const data = loadUserData();

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

      let rarity = null;
      let amountIndex = 2;
      if (type === 'keys') {
        rarity = args[2]?.toLowerCase();
        amountIndex++;
        if (!rarity || !validRaritiesLower.includes(rarity)) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('Invalid Rarity')
                .setDescription(`Valid rarities: ${validRaritiesLower.join(', ')}`)
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

      // Initialize user data structurally if missing
      if (!data[userId] || typeof data[userId] !== 'object') data[userId] = { balance: 0, inventory: {} };
      if (!data[userId].inventory || typeof data[userId].inventory !== 'object') data[userId].inventory = {};
      if (typeof data[userId].balance !== 'number') data[userId].balance = 0;

      if (subcommand === 'give') {
        if (type === 'keys') {
          data[userId].inventory[rarity] = (data[userId].inventory[rarity] || 0) + amount;
          saveUserData(data);
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('Keys Given')
                .setDescription(`Gave ${amount} ${rarity} key(s) to ${userMention.username}.`)
            ]
          });
        } else {
          data[userId].balance += amount;
          saveUserData(data);
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
          if (!data[userId].inventory[rarity] || data[userId].inventory[rarity] < amount) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Insufficient Keys')
                  .setDescription(`${userMention.username} does not have enough ${rarity} key(s).`)
              ]
            });
          }
          data[userId].inventory[rarity] -= amount;
          if (data[userId].inventory[rarity] === 0) {
            delete data[userId].inventory[rarity];
          }
          saveUserData(data);
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Keys Removed')
                .setDescription(`Removed ${amount} ${rarity} key(s) from ${userMention.username}.`)
            ]
          });
        } else {
          if (data[userId].balance < amount) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Insufficient Currency')
                  .setDescription(`${userMention.username} does not have enough 𝓚𝓪𝓷.`)
              ]
            });
          }
          data[userId].balance -= amount;
          saveUserData(data);
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
      if (!data[userId]) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('User Not Found')
              .setDescription(`No data found for user ${userMention.username}.`)
          ]
        });
      }
      delete data[userId];
      saveUserData(data);
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
