const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'dice',
  description: 'Roll a die and win rewards based on your roll!',
  async execute({ message, args, userData, saveUserData }) {
    const bet = parseInt(args[0]);

    if (!bet || isNaN(bet) || bet <= 0) {
      return message.channel.send('Usage: `.dice <amount>` (bet must be positive number)');
    }

    // userData is already loaded from MongoDB by index.js
    if (typeof userData.balance !== 'number') userData.balance = 0;

    if (userData.balance < bet) {
      return message.channel.send("You don't have enough balance to play!");
    }

    // Deduct bet first
    userData.balance -= bet;

    const roll = Math.floor(Math.random() * 6) + 1; // 1-6
    let reward = 0;
    let result = '';

    if (roll === 6) {
      reward = bet * 5;
      userData.balance += reward;
      result = `🎲 You rolled **6**! Jackpot, you win **${reward}** (5x your bet)!`;
    } else if (roll >= 4) {
      reward = bet * 2;
      userData.balance += reward;
      result = `🎲 You rolled **${roll}**! Nice, you win **${reward}** (2x your bet)!`;
    } else {
      result = `🎲 You rolled **${roll}**. Unlucky, you lose your bet.`;
    }

    // Persist to MongoDB
    await saveUserData({ balance: userData.balance });

    const embed = new EmbedBuilder()
      .setTitle('Dice Roll')
      .setDescription(result)
      .addFields(
        { name: 'New Balance', value: userData.balance.toString(), inline: true }
      )
      .setColor(reward > 0 ? '#00FF00' : '#FF0000')
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
