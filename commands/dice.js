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

    // Balanced difficulty:
    // 6 → 3x, 5 → 2x, 4 → refund, 2–3 → lose, 1 → lose 2x
    if (roll === 6) {
      reward = bet * 3;
      userData.balance += reward;
      result = `🎲 You rolled **6**! You win **${reward}** (3x your bet)!`;
    } else if (roll === 5) {
      reward = bet * 2;
      userData.balance += reward;
      result = `🎲 You rolled **5**! You win **${reward}** (2x your bet)!`;
    } else if (roll === 4) {
      // refund
      userData.balance += bet;
      result = `🎲 You rolled **4**. Your bet is refunded.`;
    } else if (roll === 2 || roll === 3) {
      result = `🎲 You rolled **${roll}**. Unlucky, you lose your bet.`;
    } else {
      // roll === 1: lose double
      userData.balance -= bet;
      result = `🎲 You rolled **1**! Critical fail — you lose 2x your bet!`;
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
