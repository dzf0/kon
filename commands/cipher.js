const { EmbedBuilder } = require('discord.js');
const User = require('../models/User'); // Your MongoDB User model

module.exports = {
  name: 'cipher',
  description: 'Start a cipher challenge with betting',
  async execute({ message, args }) {
    const userId = message.author.id;
    const betAmount = parseInt(args[0]);

    // Validate bet amount
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Invalid Bet Amount')
            .setDescription('**Usage:** `.cipher <amount>`\n\n**Example:** `.cipher 500`')
        ]
      });
    }

    // Check if user already has an active challenge
    if (global.activeChallenges && global.activeChallenges.has(userId)) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Orange')
            .setTitle('⚠️ Challenge Already Active')
            .setDescription('You already have an active cipher challenge! Finish it first or wait for the timer to expire.')
        ]
      });
    }

    // Get user from database
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, balance: 0 });
      await user.save();
    }

    // Check if user has enough balance
    if (user.balance < betAmount) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('💰 Insufficient Balance')
            .setDescription(
              `You don't have enough coins to bet!\n\n` +
              `**Your Balance:** ${user.balance} coins\n` +
              `**Bet Amount:** ${betAmount} coins\n` +
              `**Needed:** ${betAmount - user.balance} more coins`
            )
        ]
      });
    }

    // Deduct bet amount from balance
    user.balance -= betAmount;
    await user.save();

    // Generate random secret message
    const messages = [
      'FORGE MASTER', 'SHADOW BLADE', 'IRON THRONE', 'DRAGON SLAYER',
      'CRYSTAL KNIGHT', 'FIRE STORM', 'GOLDEN SHIELD', 'THUNDER BOLT',
      'MYSTIC RUNE', 'STEEL WARRIOR', 'DARK MAGIC', 'HOLY GRAIL',
      'BLOOD MOON', 'ICE WIZARD', 'WIND WALKER', 'EARTH TITAN',
      'VOID HUNTER', 'STAR GAZER', 'SOUL KEEPER', 'TIME BENDER'
    ];
    const secretMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Generate 3 different ciphers
    const ciphers = generateCiphers(secretMessage);
    
    // Time limits (2 minutes)
    const timeLimit = 120000; // 120 seconds
    const speedBonus = 60000; // 60 seconds for 3x multiplier
    const startTime = Date.now();
    
    // Calculate potential rewards
    const baseReward = betAmount * 2; // 2x on normal win
    const speedReward = betAmount * 3; // 3x on speed win
    
    // Create epic challenge embed
    const challengeEmbed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔐 CIPHER CHALLENGE ACTIVATED!')
      .setDescription(
        `${message.author} has entered the **Cipher Arena**!\n\n` +
        `💰 **Bet Amount:** ${betAmount} coins (deducted)\n` +
        `⏰ **Time Limit:** 2 minutes\n` +
        `⚡ **Speed Bonus:** Complete in under 60s for 3x reward!\n` +
        `❌ **Failure:** Lose your bet if time runs out\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `**The secret message has been encoded with THREE different ciphers.**\n` +
        `**Decode all three to reveal the answer!**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .addFields(
        { 
          name: '🔢 Cipher #1: Binary Code', 
          value: `\`\`\`${ciphers.binary}\`\`\``,
          inline: false 
        },
        { 
          name: '🔄 Cipher #2: Reverse String', 
          value: `\`\`\`${ciphers.reverse}\`\`\``,
          inline: false 
        },
        { 
          name: '🔀 Cipher #3: Atbash Cipher', 
          value: `\`\`\`${ciphers.atbash}\`\`\``,
          inline: false 
        }
      )
      .addFields(
        {
          name: '💎 Reward Breakdown',
          value: 
            `✅ **Normal Clear (under 2 min):** ${baseReward} coins\n` +
            `⚡ **Speed Clear (under 60s):** ${speedReward} coins`,
          inline: false
        }
      )
      .setFooter({ text: '💡 Tip: Just type the decoded message in this channel!' })
      .setTimestamp();

    await message.channel.send({ embeds: [challengeEmbed] });

    // Initialize challenge tracking system
    if (!global.activeChallenges) {
      global.activeChallenges = new Map();
    }
    
    // Store challenge data
    global.activeChallenges.set(userId, {
      answer: secretMessage.toUpperCase(),
      startTime: startTime,
      timeLimit: timeLimit,
      speedBonus: speedBonus,
      betAmount: betAmount,
      baseReward: baseReward,
      speedReward: speedReward,
      channelId: message.channel.id,
      attempts: 0
    });

    // Set automatic failure timeout
    const timeoutId = setTimeout(async () => {
      if (global.activeChallenges.has(userId)) {
        global.activeChallenges.delete(userId);
        
        const failEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('⏰ TIME EXPIRED!')
          .setDescription(
            `${message.author}, you ran out of time!\n\n` +
            `**The correct answer was:** \`${secretMessage}\`\n\n` +
            `💀 **Lost:** ${betAmount} coins\n` +
            `📊 **New Balance:** ${user.balance} coins\n\n` +
            `*Better luck next time, challenger!*`
          )
          .setTimestamp();

        message.channel.send({ embeds: [failEmbed] });
      }
    }, timeLimit);

    // Store timeout ID so we can cancel it if they win
    global.activeChallenges.get(userId).timeoutId = timeoutId;
  }
};

// Cipher generation helper function
function generateCiphers(text) {
  // 1. Binary Cipher - Convert each character to 8-bit binary
  const binary = text.split('').map(char => {
    if (char === ' ') return '00100000'; // Space in binary
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join(' ');

  // 2. Reverse Cipher - Simply reverse the entire string
  const reverse = text.split('').reverse().join('');

  // 3. Atbash Cipher - A↔Z, B↔Y, C↔X, etc.
  const atbash = text.split('').map(char => {
    if (char === ' ') return ' ';
    
    if (char.match(/[A-Z]/)) {
      return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
    } else if (char.match(/[a-z]/)) {
      return String.fromCharCode(122 - (char.charCodeAt(0) - 97));
    }
    return char;
  }).join('');

  return { binary, reverse, atbash };
}
