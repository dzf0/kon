const { EmbedBuilder } = require('discord.js');

const wheel = [
  { num: 0, color: 'green' },
  // Sequence alternates but for simplicity just use these
  // Actual casino wheels mix order but colors and odds are enough for this purpose:
  ...Array.from({ length: 36 }, (_, i) => ({
    num: i + 1,
    color: (i % 2 === 0 ? 'black' : 'red')
  }))
];

function spinWheel() {
  const idx = Math.floor(Math.random() * wheel.length);
  return wheel[idx];
}

module.exports = {
  name: 'roulette',
  description: 'Bet on red, black, green, or a number (0-36) for a big payout!',
  async execute({ message, args, userData, saveUserData }) {
    if (args.length < 2)
      return message.channel.send('Usage: !roulette <amount> <red|black|green|0-36>');

    const bet = parseInt(args[0]);
    const choiceRaw = args[1].toLowerCase();
    const userId = message.author.id;

    if (isNaN(bet) || bet <= 0)
      return message.channel.send('Bet must be a positive integer!');
    userData[userId] = userData[userId] || { balance: 0, inventory: {} };
    if (typeof userData[userId].balance !== 'number') userData[userId].balance = 0;

    if (userData[userId].balance < bet)
      return message.channel.send("You don't have enough balance to bet that!");

    // Deduct bet first
    userData[userId].balance -= bet;

    // Validate bet
    let betType;
    let betNumber = null;
    if (['red', 'black', 'green'].includes(choiceRaw)) {
      betType = choiceRaw;
    } else if (!isNaN(parseInt(choiceRaw)) && parseInt(choiceRaw) >= 0 && parseInt(choiceRaw) <= 36) {
      betType = 'number';
      betNumber = parseInt(choiceRaw);
    } else {
      return message.channel.send('Invalid bet. Choose red, black, green, or a number 0-36.');
    }

    // Spin
    const result = spinWheel();

    let winnings = 0;
    let desc = `Wheel Result: **${result.num} (${result.color})**\n`;

    if (betType === 'number' && betNumber === result.num) {
      winnings = bet * 36;
      userData[userId].balance += winnings;
      desc += `🎉 Lucky number! You win **${winnings}** (36x bet)!`;
    } else if (betType === 'red' && result.color === 'red') {
      winnings = bet * 2;
      userData[userId].balance += winnings;
      desc += `🟥 Red! You win **${winnings}** (2x bet)!`;
    } else if (betType === 'black' && result.color === 'black') {
      winnings = bet * 2;
      userData[userId].balance += winnings;
      desc += `⬛ Black! You win **${winnings}** (2x bet)!`;
    } else if (betType === 'green' && result.num === 0) {
      winnings = bet * 18;
      userData[userId].balance += winnings;
      desc += `🟩 Green zero! You win **${winnings}** (18x bet)!`;
    } else {
      desc += "You lost your bet.";
    }

    saveUserData();

    const embed = new EmbedBuilder()
      .setTitle('🎲 Roulette Spin 🎲')
      .setDescription(desc)
      .addFields(
        { name: 'Your New Balance', value: userData[userId].balance.toString(), inline: true }
      )
      .setColor(winnings > 0 ? "#00FF00" : "#FF0000")
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
