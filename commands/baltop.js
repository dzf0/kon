const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
  name: 'baltop',
  description: 'View the richest users on the server',
  async execute({ message, client }) {
    try {
      // Get User model from mongoose
      const User = mongoose.model('User');

      // Fetch top 10 users by balance, sorted descending
      const topUsers = await User.find({})
        .sort({ balance: -1 })
        .limit(10)
        .lean();

      if (!topUsers || topUsers.length === 0) {
        return message.channel.send('❌ No users found in the database.');
      }

      // Build leaderboard string
      let leaderboard = '';
      
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const rank = i + 1;
        
        // Try to fetch Discord user
        let username = 'Unknown User';
        try {
          const discordUser = await client.users.fetch(user.userId);
          username = discordUser.username;
        } catch (err) {
          username = `User ${user.userId.slice(0, 8)}`;
        }

        // Medal emojis for top 3
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`;
        
        leaderboard += `${medal} **${username}** - ${user.balance.toLocaleString()} coins\n`;
      }

      // Find current user's rank if not in top 10
      const currentUserData = await User.findOne({ userId: message.author.id });
      let userRankInfo = '';
      
      if (currentUserData) {
        const allUsers = await User.find({}).sort({ balance: -1 }).lean();
        const userRank = allUsers.findIndex(u => u.userId === message.author.id) + 1;
        
        if (userRank > 10) {
          userRankInfo = `\n\n**Your Rank:** #${userRank} - ${currentUserData.balance.toLocaleString()} coins`;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('💰 Balance Leaderboard - Top 10')
        .setDescription(leaderboard + userRankInfo)
        .setColor('#FFD700')
        .setFooter({ text: 'Keep earning to climb the ranks!' })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in baltop command:', error);
      message.channel.send('❌ An error occurred while fetching the leaderboard.');
    }
  },
};
