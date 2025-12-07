const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'slots',
  description: 'Simple slots game',
  async execute({ message, args, userData, saveUserData }) {
    const betAmount = parseInt(args[0]);
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return message.channel.send('Please enter a valid positive bet amount. Usage: `.slots <amount>`');
    }

    // userData is already loaded from MongoDB by index.js
    if (typeof userData.balance !== 'number') userData.balance = 0;

    if (userData.balance < betAmount) {
      return message.channel.send('You do not have enough balance to bet this amount.');
    }

    // Deduct bet amount first
    userData.balance -= betAmount;

    // Slots emojis
    const emojis = ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐', '7️⃣'];

    // Spin result
    const spin = [
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)],
    ];

    let winnings = 0;
    let resultMessage = '';

    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      winnings = betAmount * 10;
      userData.balance += winnings;
      resultMessage = 'Jackpot! You won 10x your bet!';
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
      winnings = betAmount * 2;
      userData.balance += winnings;
      resultMessage = 'Nice! You won 2x your bet!';
    } else {
      resultMessage = 'Sorry, you lost your bet.';
    }

    // Persist to MongoDB – one argument, wrapper adds userId
    await saveUserData({ balance: userData.balance });

    const embed = new EmbedBuilder()
      .setTitle('🎰 Slots Machine 🎰')
      .addFields(
        { name: 'Spin Result', value: spin.join(' | '), inline: false },
        { name: 'Outcome', value: resultMessage, inline: false },
        { name: 'Balance', value: userData.balance.toString(), inline: false }
      )
      .setColor(winnings > 0 ? '#00FF00' : '#FF0000')
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
