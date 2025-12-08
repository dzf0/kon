const { EmbedBuilder } = require('discord.js');

const ADMIN_ROLE_ID = '1382513369801555988';

module.exports = {
  name: 'help',
  description: 'Shows all available commands',
  async execute({ message, args, prefix, client }) {
    const category = args[0]?.toLowerCase();

    // Detailed category help
    if (category) {
      let embed;

      switch (category) {
        case 'economy':
          embed = new EmbedBuilder()
            .setTitle('💰 Economy Commands')
            .setColor('#FFD700')
            .addFields(
              { name: `${prefix}bal [@user]`, value: 'Check your balance or another user\'s balance', inline: false },
              { name: `${prefix}baltop`, value: 'View the richest users on the server', inline: false },
              { name: `${prefix}daily`, value: 'Claim your daily reward', inline: false }
            );
          break;

        case 'games':
          embed = new EmbedBuilder()
            .setTitle('🎮 Game Commands')
            .setColor('#FF6B6B')
            .addFields(
              { name: `${prefix}dice <amount>`, value: 'Roll a die and win rewards based on your roll', inline: false },
              { name: `${prefix}slots <amount>`, value: 'Play slots - match 3 for jackpot!', inline: false },
              { name: `${prefix}rps <amount> <rock|paper|scissors>`, value: 'Play rock paper scissors', inline: false },
              { name: `${prefix}cf <amount> <h|t>`, value: 'Flip a coin and bet on heads or tails', inline: false },
              { name: `${prefix}roulette <amount> <red|black|green|0-36>`, value: 'Play roulette and win big!', inline: false },
              { name: `${prefix}blackjack <amount>`, value: 'Play blackjack and beat the dealer', inline: false },
              { name: `${prefix}hl <amount>`, value: 'Higher or Lower - guess correctly to win', inline: false },
              { name: `${prefix}minesweeper start <size> <mines> <bet>`, value: 'Start your own minesweeper game', inline: false }
            );
          break;

        case 'multiplayer':
          embed = new EmbedBuilder()
            .setTitle('🎯 Multiplayer Game Commands')
            .setColor('#4ECDC4')
            .addFields(
              { name: `${prefix}hangman start <word>`, value: '(Admin) Start a hangman game', inline: false },
              { name: `${prefix}hangman guess <letter>`, value: 'Guess a letter in the active hangman game', inline: false },
              { name: `${prefix}wordscramble start <word>`, value: '(Admin) Start a word scramble game', inline: false },
              { name: `${prefix}guess start`, value: '(Admin) Start a number guessing game (1-500)', inline: false },
              { name: `${prefix}guess stop`, value: '(Admin) Stop the guessing game', inline: false }
            );
          break;

        case 'shop':
          embed = new EmbedBuilder()
            .setTitle('🏪 Shop & Items')
            .setColor('#9B59B6')
            .addFields(
              { name: `${prefix}shop`, value: 'View items available for purchase', inline: false },
              { name: `${prefix}buy <item_id>`, value: 'Buy an item from the shop', inline: false },
              { name: `${prefix}inventory`, value: 'View your inventory', inline: false },
              { name: `${prefix}open <rarity> [amount]`, value: 'Open keys to receive prizes', inline: false },
              { name: `${prefix}trade @user`, value: 'Start a trade with another user', inline: false },
              { name: `${prefix}trade offer currency <amount>`, value: 'Offer coins in active trade', inline: false },
              { name: `${prefix}trade offer item <name> <amount>`, value: 'Offer items in active trade', inline: false },
              { name: `${prefix}trade view`, value: 'View current trade offers', inline: false },
              { name: `${prefix}trade confirm`, value: 'Confirm your side of the trade', inline: false },
              { name: `${prefix}trade cancel`, value: 'Cancel the active trade', inline: false }
            );
          break;

        case 'keys':
          embed = new EmbedBuilder()
            .setTitle('🔑 Key System')
            .setColor('#F39C12')
            .addFields(
              { name: `${prefix}redeem`, value: 'Claim a dropped key', inline: false },
              { name: 'Passive Key Drops', value: 'Keys drop randomly in the key drop channel as you chat', inline: false }
            );
          break;

        case 'lottery':
          embed = new EmbedBuilder()
            .setTitle('🎟️ Lottery')
            .setColor('#E74C3C')
            .addFields(
              { name: `${prefix}lottery buy`, value: 'Buy a lottery ticket (max 5 per user)', inline: false },
              { name: `${prefix}lottery status`, value: 'Check current pot and tickets sold', inline: false },
              { name: `${prefix}lottery draw`, value: '(Admin) Draw a winner from all tickets', inline: false }
            );
          break;

        case 'admin':
          if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return message.channel.send('❌ You do not have permission to view admin commands.');
          }
          embed = new EmbedBuilder()
            .setTitle('⚙️ Admin Commands')
            .setColor('#E67E22')
            .addFields(
              { name: `${prefix}admin give currency <amount> @user`, value: 'Give coins to a user', inline: false },
              { name: `${prefix}admin give keys <rarity> <amount> @user`, value: 'Give keys to a user', inline: false },
              { name: `${prefix}admin remove currency <amount> @user`, value: 'Remove coins from a user', inline: false },
              { name: `${prefix}admin remove keys <rarity> <amount> @user`, value: 'Remove keys from a user', inline: false },
              { name: `${prefix}admin reset @user`, value: 'Reset a user\'s balance and inventory', inline: false },
              { name: `${prefix}admin spawn <rarity> hannel_id>`, value: 'Spawn a key in a specific channel', inline: false },
              { name: `${prefix}adminlogs`, value: 'View admin action logs from past 7 days', inline: false }
            );
          break;

        default:
          return message.channel.send(`❌ Unknown category. Available: \`economy\`, \`games\`, \`multiplayer\`, \`shop\`, \`keys\`, \`lottery\`, \`admin\``);
      }

      embed.setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // Main help menu
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Commands')
      .setDescription(
        `**Prefix:** \`${prefix}\`\n\n` +
        `Use \`${prefix}help ategory>\` for detailed command info\n\n` +
        `**Available Categories:**\n` +
        `• \`economy\` - Balance, daily rewards, leaderboard\n` +
        `• \`games\` - Betting games and mini-games\n` +
        `• \`multiplayer\` - Group games (hangman, wordscramble, guess)\n` +
        `• \`shop\` - Shop, inventory, trading\n` +
        `• \`keys\` - Key drop system\n` +
        `• \`lottery\` - Lottery system\n` +
        `• \`admin\` - Admin commands (Admin only)`
      )
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        {
          name: '💰 Popular Commands',
          value: `\`${prefix}bal\` \`${prefix}daily\` \`${prefix}inventory\` \`${prefix}shop\``,
          inline: false
        },
        {
          name: '🎮 Quick Games',
          value: `\`${prefix}dice 100\` \`${prefix}slots 50\` \`${prefix}rps 100 rock\``,
          inline: false
        }
      )
      .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};
