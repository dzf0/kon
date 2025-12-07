const { EmbedBuilder } = require('discord.js');

const ADMIN_ROLE_ID = '1382513369801555988'; // Replace with your admin role ID

module.exports = {
  name: 'adminlogs',
  description: 'View admin command logs from the past 7 days (Admin only)',
  async execute({ message, AdminLog, client }) {
    // Check if user has admin role
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Access Denied')
            .setDescription('Only admins can view admin logs.')
        ]
      });
    }

    try {
      // Get logs from past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const logs = await AdminLog.find({
        timestamp: { $gte: sevenDaysAgo }
      })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      if (!logs || logs.length === 0) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('📋 Admin Logs')
              .setDescription('No admin actions recorded in the past 7 days.')
              .setTimestamp()
          ]
        });
      }

      // Group logs into chunks of 10 for better readability
      const logsPerPage = 10;
      const totalPages = Math.ceil(logs.length / logsPerPage);
      const firstPageLogs = logs.slice(0, logsPerPage);

      // Build log entries
      let logText = '';
      for (const log of firstPageLogs) {
        const date = new Date(log.timestamp);
        const dateStr = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const target = log.targetUsername ? ` → **${log.targetUsername}**` : '';
        const details = log.details ? ` \`${log.details}\`` : '';

        logText += `\`${dateStr}\` **${log.adminUsername}** used \`.${log.command}\` - ${log.action}${target}${details}\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Admin Command Logs (Past 7 Days)')
        .setDescription(logText || 'No logs to display')
        .setColor('#5865F2')
        .setFooter({ 
          text: `Page 1/${totalPages} • Showing ${firstPageLogs.length} of ${logs.length} logs` 
        })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching admin logs:', error);
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Error')
            .setDescription('Failed to retrieve admin logs. Check console for details.')
        ]
      });
    }
  }
};
