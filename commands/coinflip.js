const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'cf',
  description: 'Flip a coin and bet on heads(h) or tails(t).',
  async execute({ message, args, userData, saveUserData }) {
    if (args.length < 2) {
      return message.channel.send('Usage: !cf <amount> <h|t>');
    }

    const betAmount = parseInt(args[0]);
    const guess = args[1].toLowerCase();

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.channel.send('Please enter a valid positive amount to bet.');
    }

    if (guess !== 'h' && guess !== 't') {
      return message.channel.send('You must bet on "h" (heads) or "t" (tails).');
    }

    const userId = message.author.id;

    // Initialize user data
    if (!userData[userId]) userData[userId] = { balance: 0, inventory: {} };
    if (typeof userData[userId].balance !== 'number') userData[userId].balance = 0;

    if (userData[userId].balance < betAmount) {
      return message.channel.send('You do not have enough balance to place that bet.');
    }

    // Deduct bet first
    userData[userId].balance -= betAmount;

    const coinSides = ['h', 't'];
    const result = coinSides[Math.floor(Math.random() * coinSides.length)];

    let embed = new EmbedBuilder()
      .setTitle('🪙 Coin Flip Result')
      .setTimestamp();

    if (guess === result) {
      // User wins: return original bet + winnings (total 2x bet)
      const winnings = betAmount * 2;
      userData[userId].balance += winnings;
      embed.setColor('#00FF00')
           .setDescription(`${message.author}, The coin landed on **${result === 'h' ? 'Heads' : 'Tails'}**! You won ${betAmount} (doubled your bet)!`)
           .addFields(
             { name: 'New Balance', value: userData[userId].balance.toString(), inline: true }
           );
    } else {
      // User loses: bet already deducted
      embed.setColor('#FF0000')
           .setDescription(`${message.author}, The coin landed on **${result === 'h' ? 'Heads' : 'Tails'}**. You lost ${betAmount}.`)
           .addFields(
             { name: 'New Balance', value: userData[userId].balance.toString(), inline: true }
           );
    }

    // Save changes to persistent storage (matches keydrop.js pattern)
    saveUserData();

    message.channel.send({ embeds: [embed] });
  },
};
