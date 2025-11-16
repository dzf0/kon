const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'balance',
  description: 'Check your balance or another user\'s balance',
  async execute({ message, args, userData }) {
    try {
      // Get the user to check balance for (mentioned user or message author)
      const user = message.mentions.users.first() || message.author;
      const userId = user.id;

      // Defensive check: initialize user data if missing
      if (!userData[userId]) {
        userData[userId] = { balance: 0, inventory: {} };
      }

      const balance = userData[userId].balance || 0;

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${user.username}'s Balance`)
        .setDescription(`💰 Balance: **${balance}** coins`)
        .setTimestamp()
        .setFooter({ text: 'Your friendly bot' });

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in balance command:', error);
      message.channel.send('❌ Something went wrong while fetching balance.');
    }
  },
};
