const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'dice',
  description: 'Roll a die and win rewards based on your roll!',
  async execute({ message, args, userData, saveUserData }) {
    const bet = parseInt(args[0]);

    if (!bet || isNaN(bet) || bet <= 0) {
      return message.channel.send('Usage: `.dice <amount>` (bet must be positive number)');
    }

    if (typeof userData.balance !== 'number') userData.balance = 0;

    if (userData.balance < bet) {
      return message.channel.send("You don't have enough balance to play!");
    }

    // Deduct bet first
    userData.balance -= bet;

    const roll = Math.floor(Math.random() * 6) + 1; // 1-6
    let reward = 0;
    let result = '';

    // Easier to profit:
    // 6 → 4x, 5 → 3x, 3–4 → 2x, 2 → refund, 1 → lose
    if (roll === 6) {
      reward = bet * 4;
      userData.balance += reward;
      result = `🎲 You rolled **6**! You win **${reward}** (4x your bet)!`;
    } else if (roll === 5) {
      reward = bet * 3;
      userData.balance += reward;
      result = `🎲 You rolled **5**! You win **${reward}** (3x your bet)!`;
    } else if (roll === 3 || roll === 4) {
      reward = bet * 2;
      userData.balance += reward;
      result = `🎲 You rolled **${roll}**! You win **${reward}** (2x your bet)!`;
    } else if (roll === 2) {
      // refund
      userData.balance += bet;
      result = `🎲 You rolled **2**. Your bet is refunded.`;
    } else {
      result = `🎲 You rolled **1**. Unlucky, you lose your bet.`;
    }

    await saveUserData({ balance: userData.balance });

    const embed = new EmbedBuilder()
      .setTitle('Dice Roll')
      .setDescription(result)
      .addFields({ name: 'New Balance', value: userData.balance.toString(), inline: true })
      .setColor(reward > 0 ? '#00FF00' : '#FF0000')
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
