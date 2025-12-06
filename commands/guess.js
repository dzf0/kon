const { EmbedBuilder } = require('discord.js');

const GUESS_ADMIN_ROLE_ID = '1382513369801555988'; // Replace with your role ID
const GUESS_CHANNEL_ID = '1405349401945178152'; // Replace with your game channel ID

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

module.exports = {
  name: 'guess',
  description: 'Guess a number game with admin controls.',
  async execute({ message, args, userData, saveUserData, addKeyToInventory, updateUserBalance }) {
    const sub = (args[0] || '').toLowerCase();
    const isAdmin = message.member.roles.cache.has(GUESS_ADMIN_ROLE_ID);

    // Admin command to start game
    if (sub === 'start') {
      if (!isAdmin) {
        const noPermEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Permission Denied')
          .setDescription('Only admins can start the guessing game.');
        return message.channel.send({ embeds: [noPermEmbed] });
      }

      // Enforce specific channel
      if (message.channel.id !== GUESS_CHANNEL_ID) {
        return message.channel.send(`❌ The guessing game can only be started in <#${GUESS_CHANNEL_ID}>.`);
      }

      if (guessGameState.active) {
        const alreadyEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('Game Already Running')
          .setDescription('There is already an active guessing game.');
        return message.channel.send({ embeds: [alreadyEmbed] });
      }

      const num = Math.floor(Math.random() * 500) + 1;
      guessGameState.active = true;
      guessGameState.number = num;
      guessGameState.channelId = message.channel.id;

      const startEmbed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('Guessing Game Started!')
        .setDescription('Guess the number between 1 and 500 by typing numbers in chat. First correct guess wins!');
      return message.channel.send({ embeds: [startEmbed] });
    }

    // Admin command to stop game
    if (sub === 'stop') {
      if (!isAdmin) {
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

    // Help/default
    return message.channel.send(
      '**Guessing Game Commands:**\n' +
      '`.guess start` - Start a new game (admin only, in game channel)\n' +
      '`.guess stop` - Stop the current game (admin only)\n\n' +
      'Players: Just type a number in the game channel while a game is active!'
    );
  },

  guessGameState,
  guessGameRarities,
  getRandomRarity,
};
