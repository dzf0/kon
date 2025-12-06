const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Show all available commands.',
  async execute({ message, prefix }) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Help Menu')
      .setDescription(`Prefix: \`${prefix}\`\nHere are all available commands:`)
      .setColor('#00AAFF')
      .addFields(
        {
          name: 'Economy',
          value: [
            `\`${prefix}bal\` - Show your current balance.`,
            `\`${prefix}inventory\` - View your keys and items.`,
            `\`${prefix}shop\` - View the shop items.`,
            `\`${prefix}open <rarity> [amount]\` - Open keys of a rarity to get coins.`,
            `\`${prefix}claim\` - Claim a dropped key if one is active.`
          ].join('\n'),
          inline: false
        },
        {
          name: 'Gambling & Games',
          value: [
            `\`${prefix}cf <amount> <h|t>\` - Coin flip betting game.`,
            `\`${prefix}slots <amount>\` - Slot machine, win up to 10x.`,
            `\`${prefix}dice <amount>\` - Dice game, high rolls pay more.`,
            `\`${prefix}rps <amount> <rock|paper|scissors>\` - Rock, paper, scissors vs bot.`,
            `\`${prefix}roulette <amount> <red|black|green|0-36>\` - Roulette wheel bets.`,
            `\`${prefix}hl <amount>\` - Higher or Lower number streak game.`,
            `\`${prefix}blackjack <amount>\` - Blackjack with reactions (hit/stand).`,
            `\`${prefix}minesweeper start <size> <mines> <bet>\` - Start your own minesweeper game.`,
            `\`${prefix}minesweeper pick <tile>\` - Pick a tile in your minesweeper game.`,
            `\`${prefix}minesweeper cancel\` - Cancel your minesweeper game.`
          ].join('\n'),
          inline: false
        },
        {
          name: 'Lottery',
          value: [
            `\`${prefix}lottery buy\` - Buy a lottery ticket.`,
            `\`${prefix}lottery status\` - Check lottery pot and ticket count.`,
            `\`${prefix}lottery draw\` - Draw a lottery winner (staff only).`
          ].join('\n'),
          inline: false
        },
        {
          name: 'Trivia & Word Games',
          value: [
            `\`${prefix}trivia\` - Answer a trivia question for rewards.`,
            `\`${prefix}wordscramble start <word>\` - (staff) Start a word scramble in the game channel.`,
            `\`${prefix}wordscramble cancel\` - (staff) Cancel active word scramble.`,
            `\`${prefix}hangman start <word>\` - (staff) Start a hangman game in the game channel.`,
            `\`${prefix}hangman guess <letter>\` - Guess a letter in hangman.`,
            `\`${prefix}hangman cancel\` - (staff) Cancel the current hangman game.`,
            `\`${prefix}guess start [number]\` - (staff) Start a number guessing game.`,
            `\`${prefix}guess stop\` - (staff) Stop the current guessing game.`
          ].join('\n'),
          inline: false
        },
        {
          name: 'Keydrop & Passive',
          value: [
            `\`${prefix}claim\` - Claim the active dropped key (from keydrop system).`
          ].join('\n'),
          inline: false
        },
        {
          name: 'Admin / Staff Only',
          value: [
            `\`${prefix}admin give currency <amount> @user\` - Give currency to a user.`,
            `\`${prefix}admin remove currency <amount> @user\` - Remove currency from a user.`,
            `\`${prefix}admin give keys <rarity> <amount> @user\` - Give keys of a rarity.`,
            `\`${prefix}admin remove keys <rarity> <amount> @user\` - Remove keys of a rarity.`,
            `\`${prefix}admin reset @user\` - Reset all data for a user.`,
            `\`${prefix}lottery draw\` - Draw the lottery winner.`,
            `\`${prefix}wordscramble start <word>\` - Start a word scramble round.`,
            `\`${prefix}wordscramble cancel\` - Cancel word scramble.`,
            `\`${prefix}hangman start <word>\` - Start hangman with a secret word.`,
            `\`${prefix}hangman cancel\` - Cancel current hangman game.`,
            `\`${prefix}guess start [number]\` - Start a number guessing game.`,
            `\`${prefix}guess stop\` - Stop the current guessing game.`
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'Use each command for more details and correct arguments.' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
