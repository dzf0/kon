const { EmbedBuilder } = require('discord.js');

const guessGameState = {
  active: false,
  number: null,
  channelId: null,
};

const guessGameRarities = [
  { name: 'Prismatic', chance: 0.005, minKan: 1000, maxKan: 2000 },
  { name: 'Mythical', chance: 0.03, minKan: 500, maxKan: 999 },
  { name: 'Legendary', chance: 0.10, minKan: 200, maxKan: 499 },
  { name: 'Rare', chance: 0.25, minKan: 100, maxKan: 199 },
  { name: 'Uncommon', chance: 0.27, minKan: 50, maxKan: 99 },
  { name: 'Common', chance: 0.33, minKan: 10, maxKan: 49 },
];

function getRandomRarity(rarities) {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of rarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity;
  }
  return rarities[rarities.length - 1];
}

function addKanToUser(userId, amount, data) {
  if (!data[userId]) data[userId] = { balance: 0, inventory: {} };
  if (typeof data[userId].balance !== 'number') data[userId].balance = 0;
  data[userId].balance += amount;
}

function addKeyToInventory(userId, rarity, quantity, data) {
  if (!data[userId]) data[userId] = { balance: 0, inventory: {} };
  if (!data[userId].inventory) data[userId].inventory = {};
  data[userId].inventory[rarity] = (data[userId].inventory[rarity] || 0) + quantity;
}

module.exports = {
  name: 'guess',
  description: 'Guess a number game with admin controls.',
  async execute({ message, args, data, saveUserData, ADMIN_ROLE_ID }) {
    // Admin command to stop game
    if (args.length > 0 && args[0].toLowerCase() === 'stop') {
      if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
        const noPermEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Permission Denied')
          .setDescription('Only admins can stop the guessing game.');
        return message.channel.send({ embeds: [noPermEmbed] });
      }

      if (!guessGameState.active) {
        const noGameEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('No Active Game')
          .setDescription('There is no guessing game currently running.');
        return message.channel.send({ embeds: [noGameEmbed] });
      }

      guessGameState.active = false;
      guessGameState.number = null;
      guessGameState.channelId = null;

      const stoppedEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Game Stopped')
        .setDescription('The guessing game has been stopped by an admin.');
      return message.channel.send({ embeds: [stoppedEmbed] });
    }

    if (guessGameState.active) {
      // Process user guess
      if (args.length === 0) {
        const noGuessEmbed = new EmbedBuilder()
          .setColor('#FFAA00')
          .setTitle('No Guess Provided')
          .setDescription('Please provide a number to guess.');
        return message.channel.send({ embeds: [noGuessEmbed] });
      }

      const guess = parseInt(args[0]);
      if (isNaN(guess)) {
        const invalidGuessEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Invalid Guess')
          .setDescription('Your guess must be a valid number.');
        return message.channel.send({ embeds: [invalidGuessEmbed] });
      }

      if (guess === guessGameState.number) {
        // Win - give key and Kan
        const wonRarity = getRandomRarity(guessGameRarities);

        addKeyToInventory(message.author.id, wonRarity.name, 1, data);

        // Award Kan coins within rarity range
        const kanAmount = Math.floor(Math.random() * (wonRarity.maxKan - wonRarity.minKan + 1)) + wonRarity.minKan;
        addKanToUser(message.author.id, kanAmount, data);

        saveUserData(data);

        const winEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Congratulations!')
          .setDescription(`${message.author} guessed the correct number **${guessGameState.number}** and won a **${wonRarity.name}** key and **${kanAmount} Kan**!`);

        // End game
        guessGameState.active = false;
        guessGameState.number = null;
        guessGameState.channelId = null;

        return message.channel.send({ embeds: [winEmbed] });
      } else if (guess < guessGameState.number) {
        const higherEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setDescription('Too low! Try a higher number.');
        return message.channel.send({ embeds: [higherEmbed] });
      } else {
        const lowerEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setDescription('Too high! Try a lower number.');
        return message.channel.send({ embeds: [lowerEmbed] });
      }
    } else {
      // Start a new game
      if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
        const noPermEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Permission Denied')
          .setDescription('Only admins can start a guessing game.');
        return message.channel.send({ embeds: [noPermEmbed] });
      }

      const num = Math.floor(Math.random() * 500) + 1;
      guessGameState.active = true;
      guessGameState.number = num;
      guessGameState.channelId = message.channel.id;

      const startEmbed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('Guessing Game Started!')
        .setDescription('Guess the number between 1 and 500 by typing your guess in chat.');
      return message.channel.send({ embeds: [startEmbed] });
    }
  },
  guessGameRarities,
  getRandomRarity,
};
