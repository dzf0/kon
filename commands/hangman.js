const { EmbedBuilder } = require('discord.js');

// Track active hangman games - these are declared ONCE at the top
const activeGamesMap = new Map();

const hangmanStages = [
  '``````',
  '``````',
  '``````',
  '``````',
  '``````',
  '``````',
  '``````'
];

const ADMIN_ROLE_ID = '1382513369801555988'; // Replace with your admin role ID
const GAME_CHANNEL_ID = '1401925188991582338'; // Replace with your game channel ID

module.exports = {
  name: 'hangman',
  description: 'Play hangman! Admin sets word, try to guess it!!.',
  async execute({ message, args, userData, saveUserData, client }) {
    const sub = (args[0] || '').toLowerCase();

    // START GAME
    if (sub === 'start') {
      if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return message.channel.send('❌ Only admins can start a hangman game.');
      }

      if (activeGamesMap.has(GAME_CHANNEL_ID)) {
        return message.channel.send('❌ A hangman game is already active in the game channel!');
      }

      const word = args.slice(1).join(' ').toLowerCase();
      if (!word || word.length < 3) {
        return message.channel.send('Usage: `!hangman start <word>` (word must be at least 3 letters)');
      }

      if (!/^[a-z\s]+$/.test(word)) {
        return message.channel.send('❌ Word can only contain letters and spaces.');
      }

      await message.delete().catch(() => {});

      const gameChannel = client.channels.cache.get(GAME_CHANNEL_ID);
      if (!gameChannel) {
        return message.channel.send('❌ Game channel not found! Please check GAME_CHANNEL_ID.');
      }

      activeGamesMap.set(GAME_CHANNEL_ID, {
        word: word,
        guessed: new Set(),
        wrongGuesses: 0,
        maxWrongs: 6,
        adminId: message.author.id
      });

      const startEmbed = new EmbedBuilder()
        .setTitle('🎮 Hangman Game Started!')
        .setDescription(`A new hangman game has been started by ${message.author}!\n\nType \`!hangman guess <letter>\` to guess!\n\n${getWordDisplay(GAME_CHANNEL_ID)}`)
        .addFields({ name: 'Wrong Guesses', value: '0/6', inline: true })
        .setColor('#00FF00')
        .setTimestamp();

      return gameChannel.send({ embeds: [startEmbed] });
    }

    // GUESS LETTER
    if (sub === 'guess') {
      if (message.channel.id !== GAME_CHANNEL_ID) {
        return message.channel.send(`❌ Hangman guesses must be made in <#${GAME_CHANNEL_ID}>!`);
      }

      if (!activeGamesMap.has(GAME_CHANNEL_ID)) {
        return message.channel.send('❌ No active hangman game.');
      }

      const game = activeGamesMap.get(GAME_CHANNEL_ID);
      const guess = args[1]?.toLowerCase();

      if (!guess || guess.length !== 1 || !/[a-z]/.test(guess)) {
        return message.channel.send('Please guess a single letter: `!hangman guess <letter>`');
      }

      if (game.guessed.has(guess)) {
        return message.channel.send(`❌ Letter **${guess.toUpperCase()}** already guessed!`);
      }

      game.guessed.add(guess);

      if (game.word.includes(guess)) {
        const display = getWordDisplay(GAME_CHANNEL_ID);

        if (!display.includes('_')) {
          const userId = message.author.id;
          userData[userId] = userData[userId] || { balance: 0, inventory: {} };
          const reward = 300;
          userData[userId].balance += reward;
          saveUserData();

          const winEmbed = new EmbedBuilder()
            .setTitle('🎉 Game Won!')
            .setDescription(`${message.author} guessed the word!\n\n**Word:** ${game.word.toUpperCase()}\n\n${message.author} earned **${reward}** coins!`)
            .setColor('#00FF00')
            .setTimestamp();

          message.channel.send({ embeds: [winEmbed] });
          activeGamesMap.delete(GAME_CHANNEL_ID);
          return;
        }

        const correctEmbed = new EmbedBuilder()
          .setTitle('✅ Correct Letter!')
          .setDescription(`**${guess.toUpperCase()}** is in the word!\n\n${display}`)
          .addFields(
            { name: 'Wrong Guesses', value: `${game.wrongGuesses}/${game.maxWrongs}`, inline: true },
            { name: 'Guessed', value: Array.from(game.guessed).join(', ').toUpperCase(), inline: true }
          )
          .setColor('#00FF00')
          .setTimestamp();

        return message.channel.send({ embeds: [correctEmbed] });
      } else {
        game.wrongGuesses++;

        if (game.wrongGuesses >= game.maxWrongs) {
          const loseEmbed = new EmbedBuilder()
            .setTitle('💀 Game Over!')
            .setDescription(`${hangmanStages[game.wrongGuesses]}\n\n**The word was:** ${game.word.toUpperCase()}`)
            .setColor('#FF0000')
            .setTimestamp();

          message.channel.send({ embeds: [loseEmbed] });
          activeGamesMap.delete(GAME_CHANNEL_ID);
          return;
        }

        const wrongEmbed = new EmbedBuilder()
          .setTitle('❌ Wrong Letter!')
          .setDescription(`${hangmanStages[game.wrongGuesses]}\n\n**${guess.toUpperCase()}** is not in the word.\n\n${getWordDisplay(GAME_CHANNEL_ID)}`)
          .addFields(
            { name: 'Wrong Guesses', value: `${game.wrongGuesses}/${game.maxWrongs}`, inline: true },
            { name: 'Guessed', value: Array.from(game.guessed).join(', ').toUpperCase(), inline: true }
          )
          .setColor('#FF6347')
          .setTimestamp();

        return message.channel.send({ embeds: [wrongEmbed] });
      }
    }

    // CANCEL GAME
    if (sub === 'cancel') {
      if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return message.channel.send('❌ Only admins can cancel.');
      }

      if (!activeGamesMap.has(GAME_CHANNEL_ID)) {
        return message.channel.send('❌ No active game.');
      }

      activeGamesMap.delete(GAME_CHANNEL_ID);
      const gameChannel = client.channels.cache.get(GAME_CHANNEL_ID);
      if (gameChannel) gameChannel.send('✅ Game cancelled by admin.');
      return message.channel.send('✅ Game cancelled.');
    }

    return message.channel.send(
      '**Hangman Commands:**\n' +
      '`!hangman start <word>` - Start (admin)\n' +
      '`!hangman guess <letter>` - Guess\n' +
      '`!hangman cancel` - Cancel (admin)'
    );
  }
};

function getWordDisplay(channelId) {
  const game = activeGamesMap.get(channelId);
  if (!game) return '';

  return '**Word:** ' + game.word
    .split('')
    .map(char => {
      if (char === ' ') return '  ';
      return game.guessed.has(char) ? char.toUpperCase() : '_';
    })
    .join(' ');
}
