const { EmbedBuilder } = require('discord.js');

// ROLE THAT CAN CONTROL THE GAME (CHANGE THIS)
const GUESS_ADMIN_ROLE_ID = '1382513369801555988';

// CHANNEL WHERE THE GAME CAN RUN (CHANGE THIS)
const GUESS_CHANNEL_ID = '1401925188991582338';

module.exports = {
  name: 'guess',
  description: 'Admin controls for the server-wide guessing game.',
  /**
   * @param {Object} ctx
   * @param {import('discord.js').Message} ctx.message
   * @param {string[]} ctx.args
   * @param {Object} ctx.guessGame   // shared state from index.js
   */
  async execute({ message, args, guessGame }) {
    const sub = (args[0] || '').toLowerCase();
    const isAdmin = message.member.roles.cache.has(GUESS_ADMIN_ROLE_ID);

    // .guess start  -> starts a new game with random number 1–500
    if (sub === 'start') {
      if (!isAdmin) {
        const noPermEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Permission Denied')
          .setDescription('Only users with the configured admin role can start the guessing game.');
        return message.channel.send({ embeds: [noPermEmbed] });
      }

      // Enforce specific channel
      if (message.channel.id !== GUESS_CHANNEL_ID) {
        return message.channel.send(`❌ The guessing game can only be started in <#${GUESS_CHANNEL_ID}>.`);
      }

      if (guessGame.active) {
        const alreadyEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('Game Already Running')
          .setDescription('There is already an active guessing game in this channel.');
        return message.channel.send({ embeds: [alreadyEmbed] });
      }

      const num = Math.floor(Math.random() * 500) + 1;

      guessGame.active = true;
      guessGame.number = num;
      guessGame.channelId = message.channel.id;

      const startEmbed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('Guessing Game Started!')
        .setDescription(
          'A new guessing game has begun!
' +
          'Guess the number between **1 and 500** by simply typing numbers in this channel.
' +
          'Wrong guesses are ignored. First correct guess wins!'
        )
        .setTimestamp();

      return message.channel.send({ embeds: [startEmbed] });
    }

    // .guess stop  -> stops the current game
    if (sub === 'stop') {
      if (!isAdmin) {
        const noPermEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Permission Denied')
          .setDescription('Only users with the configured admin role can stop the guessing game.');
        return message.channel.send({ embeds: [noPermEmbed] });
      }

      if (!guessGame.active) {
        const noGameEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('No Active Game')
          .setDescription('There is no guessing game currently running.');
        return message.channel.send({ embeds: [noGameEmbed] });
      }

      guessGame.active = false;
      guessGame.number = null;
      guessGame.channelId = null;

      const stopEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Guessing Game Stopped')
        .setDescription('The current guessing game has been stopped.')
        .setTimestamp();

      return message.channel.send({ embeds: [stopEmbed] });
    }

    // Help / usage for others
    const helpEmbed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('Guessing Game Controls')
      .setDescription(
        `**Admin commands:**
` +
        ``.guess start` - Start a new guessing game (number 1–500 is chosen automatically, only in <#${GUESS_CHANNEL_ID}>).
` +
        ``.guess stop` - Stop the current guessing game.

` +
        `**Player instructions:**
` +
        `Just type a number in the game channel while a game is active.
` +
        `Wrong guesses are ignored; the first correct guess wins rewards.`
      );

    return message.channel.send({ embeds: [helpEmbed] });
  },
};
