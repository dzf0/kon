const { EmbedBuilder } = require('discord.js');

const DAILY_REWARD = 100;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
  name: 'daily',
  description: 'Claim your daily reward of 100 coins (available every 24 hours)',
  async execute({ message, userData, saveUserData }) {
    const now = Date.now();
    const lastDaily = userData.lastDaily ? new Date(userData.lastDaily).getTime() : 0;
    const timeSinceLastClaim = now - lastDaily;

    // Check if 24 hours have passed
    if (timeSinceLastClaim < DAILY_COOLDOWN) {
      const timeLeft = DAILY_COOLDOWN - timeSinceLastClaim;
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);

      const embed = new EmbedBuilder()
        .setTitle('⏰ Daily Reward on Cooldown')
        .setDescription(
          `You've already claimed your daily reward!\n\n` +
          `**Time until next claim:**\n` +
          `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`
        )
        .setColor('#FF6B6B')
        .setFooter({ text: 'Come back later!' })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // Grant daily reward
    userData.balance = (userData.balance || 0) + DAILY_REWARD;
    userData.lastDaily = new Date();

    await saveUserData({
      balance: userData.balance,
      lastDaily: userData.lastDaily
    });

    const embed = new EmbedBuilder()
      .setTitle('🎁 Daily Reward Claimed!')
      .setDescription(
        `You received **${DAILY_REWARD}** coins!\n\n` +
        `**New Balance:** ${userData.balance} coins`
      )
      .setColor('#00FF00')
      .setFooter({ text: 'Come back in 24 hours for another reward!' })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};
