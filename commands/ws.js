const { EmbedBuilder } = require('discord.js');

const AUTH_ROLE_ID = '1439504588318314496'; // Replace with your role ID for setters
const GAME_CHANNEL_ID = '1348651274396241933'; // Replace with your game channel ID (e.g., #general)

let activeScramble = null; // Only one scramble at a time

function scrambleWord(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

module.exports = {
  name: 'wordscramble',
  description: 'Start a word scramble game in the general channel. Usage: !wordscramble start <word>',
  async execute({ message, args, userData, saveUserData, client }) {
    const sub = (args[0] || '').toLowerCase();

    // START GAME (Authorized role only, from any channel)
    if (sub === 'start') {
      if (!message.member.roles.cache.has(AUTH_ROLE_ID)) {
        return message.channel.send('❌ Only authorized users can start a word scramble.');
      }

      if (activeScramble) {
        return message.channel.send('❌ A word scramble game is already active!');
      }

      const word = args.slice(1).join('').toLowerCase();
      if (!word || word.length < 3) {
        return message.channel.send('Usage: `!wordscramble start <word>` (word must be at least 3 letters, no spaces)');
      }

      if (!/^[a-z]+$/.test(word)) {
        return message.channel.send('❌ Word can only contain letters (no spaces or digits).');
      }

      await message.delete().catch(() => {});

      const scrambled = scrambleWord(word);
      activeScramble = {
        word,
        scrambled,
        setter: message.author.id,
      };

      const gameChannel = client.channels.cache.get(GAME_CHANNEL_ID);
      if (!gameChannel) {
        activeScramble = null;
        return message.channel.send('❌ Game channel not found! Check GAME_CHANNEL_ID.');
      }

      const embed = new EmbedBuilder()
        .setTitle('🧩 Word Scramble! 🧩')
        .setDescription(`Unscramble the letters!\n\n**${scrambled.toUpperCase()}**\n\n_Type your answer in chat! First correct answer wins!_`)
        .setColor('#6495ED')
        .setFooter({ text: 'No hints. Good luck!' })
        .setTimestamp();

      await gameChannel.send({ embeds: [embed] });

      // Set up collector
      const filter = m => !m.author.bot && m.content.toLowerCase() === word;
      const collector = gameChannel.createMessageCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async m => {
        const userId = m.author.id;
        userData[userId] = userData[userId] || { balance: 0, inventory: {} };
        const reward = 200;
        userData[userId].balance += reward;
        saveUserData();

        const winEmbed = new EmbedBuilder()
          .setTitle('🎉 Word Solved!')
          .setDescription(`${m.author} solved "**${word.toUpperCase()}**" and won **${reward}** coins!`)
          .setColor('#32CD32')
          .setTimestamp();
        await gameChannel.send({ embeds: [winEmbed] });

        activeScramble = null;
      });

      collector.on('end', collected => {
        if (!collected.size && activeScramble) {
          const loseEmbed = new EmbedBuilder()
            .setTitle('⏱️ Time\'s Up!')
            .setDescription(`No one solved it! The word was **${word.toUpperCase()}**.`)
            .setColor('#FFA500')
            .setTimestamp();
          gameChannel.send({ embeds: [loseEmbed] });
          activeScramble = null;
        }
      });

      return;
    }

    // CANCEL GAME (Authorized role only)
    if (sub === 'cancel') {
      if (!message.member.roles.cache.has(AUTH_ROLE_ID)) {
        return message.channel.send('❌ Only authorized users can cancel a scramble.');
      }
      if (!activeScramble) {
        return message.channel.send('❌ No active scramble to cancel.');
      }
      activeScramble = null;
      const gameChannel = client.channels.cache.get(GAME_CHANNEL_ID);
      if (gameChannel) await gameChannel.send('❌ Word scramble cancelled.');
      return message.channel.send('✅ Scramble cancelled.');
    }

    // Help/default
    return message.channel.send(
      '**Word Scramble Commands:**\n' +
      '`!wordscramble start <word>` - Start a scramble (authorized role, any channel)\n' +
      '`!wordscramble cancel` - Cancel active scramble (authorized role)'
    );
  }
};
