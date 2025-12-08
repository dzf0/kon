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

    // Nerfed payouts: 1-2 lose, 3-6 win with lower multipliers
    if (roll === 6) {
      reward = Math.floor(bet * 2.2);
      userData.balance += reward;
      result = `🎲 You rolled **6**! You win **${reward}** (2.2x your bet)!`;
    } else if (roll === 5) {
      reward = Math.floor(bet * 1.8);
      userData.balance += reward;
      result = `🎲 You rolled **5**! You win **${reward}** (1.8x your bet)!`;
    } else if (roll === 4) {
      reward = Math.floor(bet * 1.4);
      userData.balance += reward;
      result = `🎲 You rolled **4**! You win **${reward}** (1.4x your bet)!`;
    } else if (roll === 3) {
      reward = bet;
      userData.balance += reward;
      result = `🎲 You rolled **3**! You win **${reward}** (1x your bet)!`;
    } else {
      // roll === 1 or 2: lose bet
      result = `🎲 You rolled **${roll}**. Unlucky, you lose your bet.`;
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
