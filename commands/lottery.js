const { EmbedBuilder } = require('discord.js');

const LOTTERY_PRICE = 100; // Ticket price
const LOTTERY_DRAW_ROLE_ID = '1382513369801555988'; // Replace with your role ID

// Use a global object to store lottery state in memory
const lotteryState = {
  tickets: [],  // Array of Discord user IDs
  pot: 0
};

module.exports = {
  name: 'lottery',
  description: 'Join the lottery or draw a winner. Usage: !lottery buy | !lottery status | !lottery draw',
  async execute({ message, args, userData, saveUserData }) {
    const userId = message.author.id;
    const sub = (args[0] || '').toLowerCase();

    // Ensure user data shape
    userData[userId] = userData[userId] || { balance: 0, inventory: {} };

    // Helper: count how many tickets this user currently has
    const getUserTicketCount = (id) =>
      lotteryState.tickets.filter(uid => uid === id).length;

    if (sub === "buy") {
      const currentTickets = getUserTicketCount(userId);
      if (currentTickets >= 5) {
        return message.channel.send('❌ You already own the maximum of **5** lottery tickets.');
      }

      if (userData[userId].balance < LOTTERY_PRICE)
        return message.channel.send(`You need at least ${LOTTERY_PRICE} to buy a lottery ticket.`);

      // Deduct and assign ticket
      userData[userId].balance -= LOTTERY_PRICE;
      lotteryState.pot += LOTTERY_PRICE;
      lotteryState.tickets.push(userId);
      saveUserData();

      const boughtEmbed = new EmbedBuilder()
        .setTitle("🎟️ Lottery Ticket Bought!")
        .setDescription(`You bought a ticket for **${LOTTERY_PRICE}**!\nYou now have **${currentTickets + 1}/5** tickets.`)
        .addFields(
          { name: 'Total Pot', value: lotteryState.pot.toString(), inline: true },
          { name: 'Total Tickets', value: lotteryState.tickets.length.toString(), inline: true }
        )
        .setColor('#00AAFF')
        .setTimestamp();
      return message.channel.send({ embeds: [boughtEmbed] });
    }

    if (sub === "status") {
      const pot = lotteryState.pot;
      const tickets = lotteryState.tickets.length;
      const embed = new EmbedBuilder()
        .setTitle("🎰 Lottery Status")
        .setDescription("Pot and ticket count so far.")
        .addFields(
          { name: 'Total Pot', value: pot.toString(), inline: true },
          { name: 'Tickets Sold', value: tickets.toString(), inline: true }
        )
        .setColor('#FFD700')
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    if (sub === "draw") {
      // Check if the user has the specific role
      if (!message.member.roles.cache.has(LOTTERY_DRAW_ROLE_ID)) {
        return message.channel.send('❌ You do not have permission to draw the lottery. Only authorized users can do this.');
      }

      if (!lotteryState.tickets.length) {
        return message.channel.send('No tickets have been bought yet!');
      }

      // Draw winner
      const winnerIdx = Math.floor(Math.random() * lotteryState.tickets.length);
      const winnerId = lotteryState.tickets[winnerIdx];
      userData[winnerId] = userData[winnerId] || { balance: 0, inventory: {} };
      userData[winnerId].balance += lotteryState.pot;
      saveUserData();

      const winnerEmbed = new EmbedBuilder()
        .setTitle("🎉 Lottery Drawn! 🎉")
        .setDescription(`<@${winnerId}> wins the pot of **${lotteryState.pot}**! Congratulations!`)
        .setColor('#00FF00')
        .setTimestamp();

      // Reset state
      lotteryState.tickets = [];
      lotteryState.pot = 0;

      return message.channel.send({ embeds: [winnerEmbed] });
    }

    // Default error/help
    return message.channel.send(
      `Usage: \`!lottery buy\` to buy ticket (${LOTTERY_PRICE}, max 5 per user), \`!lottery status\` to check, \`!lottery draw\` (authorized users only)`
    );
  }
};
