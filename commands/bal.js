const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'bal',
  description: 'Check your balance or another user\'s balance',
  async execute({ message, args, userData, getUserData }) {
    try {
      // Get the user to check balance for (mentioned user or message author)
      const targetUser = message.mentions.users.first() || message.author;
      const targetId = targetUser.id;

      // Fetch target user's data from MongoDB
      const targetData = await getUserData(targetId);
      const balance = (targetData.balance || 0);

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${targetUser.username}'s Balance`)
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
