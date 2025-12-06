const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'hl',
  description: 'Play Higher or Lower: guess if the next number will be higher or lower!',
  async execute({ message, args, userData, saveUserData }) {
    const bet = parseInt(args[0]);

    if (!bet || isNaN(bet) || bet <= 0) 
      return message.channel.send('Usage: `.hl <amount>`');

    // userData is already loaded from MongoDB by index.js
    if (typeof userData.balance !== 'number') userData.balance = 0;

    if (userData.balance < bet) 
      return message.channel.send("You don't have enough balance for this bet.");

    // Deduct bet first
    userData.balance -= bet;
    await saveUserData({ balance: userData.balance });

    // Start with a random number (1-99, so the next is always possible)
    let current = Math.floor(Math.random() * 99) + 1;
    let streak = 0;
    let maxRounds = 5;

    // Ask for the first guess
    let embed = new EmbedBuilder()
      .setTitle('🔼 Higher or Lower 🔽')
      .setDescription(`Current number: **${current}**
React 🔼 for Higher, 🔽 for Lower.
Streak: **0**
(Payout grows for each correct guess, up to 5 rounds!)`)
      .setColor('#3333aa')
      .setTimestamp();

    let statusMsg = await message.channel.send({ embeds: [embed] });
    await statusMsg.react('🔼');
    await statusMsg.react('🔽');

    const filter = (reaction, user) =>
      ['🔼', '🔽'].includes(reaction.emoji.name) && user.id === message.author.id;

    const collector = statusMsg.createReactionCollector({ filter, time: 60000 });

    async function endGame(won, payout, streakCount, finalNum) {
      let resultMsg;
      if (won) {
        userData.balance += payout;
        await saveUserData({ balance: userData.balance });
        resultMsg = `🎉 You survived ${streakCount} rounds!\nThe next number was **${finalNum}**.\n**You won ${payout}!**`;
      } else {
        resultMsg = `❌ You lost! The next number was **${finalNum}**.\nStreak: ${streakCount}. You lost your bet.`;
      }
      const endEmbed = new EmbedBuilder()
        .setTitle('🔼 Higher or Lower 🔽 Result')
        .setDescription(resultMsg)
        .addFields({ name: 'Balance', value: userData.balance.toString(), inline: true })
        .setColor(won ? '#00FF00' : '#FF0000')
        .setTimestamp();
      await message.channel.send({ embeds: [endEmbed] });
    }

    collector.on('collect', async (reaction, user) => {
      await reaction.users.remove(user.id).catch(() => {});
      collector.resetTimer();

      // Generate new number (1-100)
      const nextNum = Math.floor(Math.random() * 100) + 1;

      const picked = reaction.emoji.name === '🔼' ? 'higher' : 'lower';

      if ((picked === 'higher' && nextNum > current) || (picked === 'lower' && nextNum < current)) {
        streak += 1;
        current = nextNum;
        if (streak >= maxRounds) {
          collector.stop('win');
          const payout = bet * (2 ** streak); // Double reward each streak, e.g. 4x, 8x, 16x, 32x on round 5
          return endGame(true, payout, streak, nextNum);
        } else {
          const streakEmbed = new EmbedBuilder()
            .setTitle('🔼 Higher or Lower 🔽')
            .setDescription(`Correct! The new number is **${nextNum}**.
React for next guess.
Streak: **${streak}** (${streak < maxRounds ? "Keep going!" : "Max reached"})`)
            .setColor('#00cc00')
            .setTimestamp();
          await statusMsg.edit({ embeds: [streakEmbed] });
        }
      } else {
        collector.stop('fail');
        return endGame(false, 0, streak, nextNum);
      }
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'win' && reason !== 'fail') {
        message.channel.send('⏱️ Higher or Lower game timed out.');
      }
    });
  },
};
