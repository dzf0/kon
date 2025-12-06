const { EmbedBuilder } = require('discord.js');

const choices = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️"
};

function getBotChoice() {
  const keys = Object.keys(choices);
  return keys[Math.floor(Math.random() * keys.length)];
}

function getResult(player, bot) {
  if (player === bot) return "draw";
  if (
    (player === "rock" && bot === "scissors") ||
    (player === "paper" && bot === "rock") ||
    (player === "scissors" && bot === "paper")
  ) return "win";
  return "lose";
}

module.exports = {
  name: 'rps',
  description: 'Play rock paper scissors and double your bet if you win!',
  async execute({ message, args, userData, saveUserData }) {
    if (args.length < 2) {
      return message.channel.send('Usage: `.rps <amount> <rock|paper|scissors>`');
    }

    const bet = parseInt(args[0]);
    const playerChoice = args[1].toLowerCase();

    if (isNaN(bet) || bet <= 0) {
      return message.channel.send('Please enter a valid positive amount to bet.');
    }
    if (!["rock", "paper", "scissors"].includes(playerChoice)) {
      return message.channel.send('Invalid choice. Use `rock`, `paper`, or `scissors`.');
    }

    // userData is already loaded from MongoDB by index.js
    if (typeof userData.balance !== 'number') userData.balance = 0;

    if (userData.balance < bet) {
      return message.channel.send('You do not have enough balance to place that bet.');
    }

    // Deduct bet up front
    userData.balance -= bet;

    const botChoice = getBotChoice();
    const outcome = getResult(playerChoice, botChoice);

    let embed = new EmbedBuilder()
      .setTitle('Rock Paper Scissors')
      .addFields(
        { name: 'Your Choice', value: `${choices[playerChoice]} ${playerChoice}`, inline: true },
        { name: 'Bot Choice', value: `${choices[botChoice]} ${botChoice}`, inline: true }
      )
      .setTimestamp();

    if (outcome === "win") {
      userData.balance += bet * 2;
      embed.setColor('#00FF00')
        .setDescription(`You won! 🎉 You get ${bet * 2}.`);
    } else if (outcome === "draw") {
      userData.balance += bet;
      embed.setColor('#CCCC00')
        .setDescription("It's a draw. Your bet was refunded.");
    } else {
      embed.setColor('#FF0000')
        .setDescription("You lost your bet. 😢");
    }

    embed.addFields({ name: 'New Balance', value: userData.balance.toString(), inline: false });

    // Persist to MongoDB
    await saveUserData({ balance: userData.balance });

    message.channel.send({ embeds: [embed] });
  }
};
