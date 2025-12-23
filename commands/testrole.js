const { EmbedBuilder } = require('discord.js');

const ADMIN_ROLE_ID = '1382513369801555988'; // same as in admin.js
const ADMIN_USER_IDS = [
  '1349792214124986419', // add yourself
  // 'ANOTHER_USER_ID',
];

module.exports = {
  name: 'tr',
  description: 'Debug: directly give SILV MEMBER to yourself',
  async execute({ message }) {
    // allow if user has admin role OR is in ADMIN_USER_IDS
    const hasAdminRole = message.member.roles.cache.has(ADMIN_ROLE_ID);
    const isAdminUser = ADMIN_USER_IDS.includes(message.author.id);
    const hasAdmin = hasAdminRole || isAdminUser;

    if (!hasAdmin) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#F5E6FF')
            .setTitle('˗ˏˋ 𐙚 𝔸𝕔𝕔𝕖𝕤𝕤 𝔻𝕖𝕟𝕚𝕖𝕕 𐙚 ˎˊ˗')
            .setDescription('Only admins can use this debug command.')
            .setFooter({ text: 'System • Permission Check' })
        ]
      });
    }

    const roleId = '1453001577995567298'; // SILV MEMBER

    const member = await message.guild.members.fetch(message.author.id);
    const role = message.guild.roles.cache.get(roleId);

    console.log('TESTROLE » role =', role && role.id, role && role.name);

    if (!role) {
      return message.reply('Role not found in this server with that ID.');
    }

    try {
      await member.roles.add(role);
      return message.reply('Role added successfully by testrole command.');
    } catch (err) {
      console.error('TESTROLE » add failed:', err);
      return message.reply('Failed to add role (see console).');
    }
  },
};
