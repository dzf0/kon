const { EmbedBuilder } = require('discord.js');

function getCard() {
  const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]; // 10 for J/Q/K, 11 for Ace
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const val = values[Math.floor(Math.random() * values.length)];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const valDisplay = (val === 11 ? 'A' : (val === 10 ? ['10', 'J', 'Q', 'K'][Math.floor(Math.random() * 4)] : val));
  return { val, display: `${valDisplay}${suit}` };
}

function handValue(hand) {
  let sum = hand.reduce((t, c) => t + c.val, 0);
  let aces = hand.filter(c => c.val === 11).length;
  while (sum > 21 && aces--) sum -= 10;
  return sum;
}

module.exports = {
  name: 'blackjack',
  description: 'Play blackjack (react for hit/stand) and win double your bet!',
  async execute({ message, args, userData, saveUserData }) {
    const bet = parseInt(args[0]);
    const userId = message.author.id;

    if (!bet || isNaN(bet) || bet <= 0) {
      return message.channel.send('Please enter a valid bet amount: `!blackjack <amount>`');
    }

    userData[userId] = userData[userId] || { balance: 0, inventory: {} };
    if (typeof userData[userId].balance !== 'number') userData[userId].balance = 0;
    if (userData[userId].balance < bet) {
      return message.channel.send('Insufficient balance.');
    }

    // Deduct bet first
    userData[userId].balance -= bet;
    saveUserData();

    // Initial hands
    let playerHand = [getCard(), getCard()];
    let dealerHand = [getCard(), getCard()];
    let finished = false;

    function embedState(customMsg = '') {
      return new EmbedBuilder()
        .setTitle('🃏 Blackjack 🃏')
        .addFields(
          { name: 'Your Hand', value: playerHand.map(c => c.display).join(' '), inline: true },
          { name: 'Dealer Hand', value: `${dealerHand[0].display} ?`, inline: true },
          { name: 'Your Value', value: handValue(playerHand).toString(), inline: false }
        )
        .setDescription(customMsg)
        .setColor('#2222AA')
        .setTimestamp();
    }

    const standEmbed = () =>
      new EmbedBuilder()
        .setTitle('🃏 Blackjack Result 🃏')
        .addFields(
          { name: 'Your Hand', value: playerHand.map(c => c.display).join(' '), inline: true },
          { name: 'Dealer Hand', value: dealerHand.map(c => c.display).join(' '), inline: true },
          { name: 'Your Value', value: handValue(playerHand).toString(), inline: true },
          { name: 'Dealer Value', value: handValue(dealerHand).toString(), inline: true }
        )
        .setTimestamp();

    async function playGame() {
      let startEmbed = embedState('React ✅ for Hit, ⏹️ for Stand.');
      let statusMsg = await message.channel.send({ embeds: [startEmbed] });
      await statusMsg.react('✅');
      await statusMsg.react('⏹️');

      const collector = statusMsg.createReactionCollector({
        filter: (r, user) => ['✅', '⏹️'].includes(r.emoji.name) && user.id === message.author.id,
        time: 60000,
      });

      collector.on('collect', async (reaction, user) => {
        if (finished) return collector.stop();
        if (reaction.emoji.name === '✅') {
          // Hit: add card
          playerHand.push(getCard());
          let val = handValue(playerHand);
          if (val > 21) {
            finished = true;
            collector.stop();
            embed = embedState('You busted! ❌');
            embed.setColor('#FF0000');
            return statusMsg.edit({ embeds: [embed] });
          } else if (val === 21) {
            // auto-stand
            finished = true;
            collector.stop();
            await statusMsg.edit({ embeds: [embedState('You hit 21! 🥇')] });
            dealerTurn();
          } else {
            // Show new hand
            await statusMsg.edit({ embeds: [embedState('Hit! React again.')] });
          }
        } else if (reaction.emoji.name === '⏹️') {
          // Stand
          finished = true;
          collector.stop();
          dealerTurn();
        }
        // Remove user's reaction for another move
        reaction.users.remove(user.id);
      });

      collector.on('end', async () => {
        if (!finished) await statusMsg.edit({ content: 'Game ended (timeout or finished).' });
      });
    }

    async function dealerTurn() {
      // Dealer hits until at least 17 or busts
      while (handValue(dealerHand) < 17) dealerHand.push(getCard());
      let playerVal = handValue(playerHand);
      let dealerVal = handValue(dealerHand);

      let result = '';

      if (playerVal > 21) {
        result = 'You busted!';
      } else if (dealerVal > 21) {
        userData[userId].balance += bet * 2;
        saveUserData();
        result = `Dealer busted! You win and get ${bet * 2} (double)! 🎉`;
      } else if (playerVal > dealerVal) {
        userData[userId].balance += bet * 2;
        saveUserData();
        result = `You beat the dealer! You win and get ${bet * 2} (double)! 🎉`;
      } else if (playerVal === dealerVal) {
        userData[userId].balance += bet; // Return bet on draw
        saveUserData();
        result = 'Draw! Your original bet was returned.';
      } else {
        result = 'Dealer wins!';
      }

      let finalEmbed = standEmbed().setDescription(result);
      if (result.includes('win')) finalEmbed.setColor('#00FF00');
      else if (result.includes('busted')) finalEmbed.setColor('#FF0000');
      else finalEmbed.setColor('#FFFF00');
      await message.channel.send({ embeds: [finalEmbed] });
    }

    await playGame();
  },
};
