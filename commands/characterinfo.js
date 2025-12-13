const { EmbedBuilder } = require('discord.js');

// Character image URLs from CDN
const characterImages = {
  // ONE PIECE
  'Luffy': 'https://static.wikia.nocookie.net/onepiece/images/6/6d/Monkey_D._Luffy_Anime_Post_Timeskip_Infobox.png',
  'Zoro': 'https://static.wikia.nocookie.net/onepiece/images/7/77/Roronoa_Zoro_Anime_Post_Timeskip_Infobox.png',
  'Shanks': 'https://static.wikia.nocookie.net/onepiece/images/c/ca/Shanks_Anime_Infobox.png',
  'Whitebeard': 'https://static.wikia.nocookie.net/onepiece/images/6/65/Edward_Newgate_Anime_Infobox.png',
  'Ace': 'https://static.wikia.nocookie.net/onepiece/images/0/0a/Portgas_D._Ace_Anime_Infobox.png',

  // NARUTO
  'Itachi': 'https://static.wikia.nocookie.net/naruto/images/b/bb/Itachi.png',
  'Sasuke': 'https://static.wikia.nocookie.net/naruto/images/2/21/Sasuke_Part_2.png',
  'Naruto': 'https://static.wikia.nocookie.net/naruto/images/d/dd/Naruto_newshot.png',

  // DRAGON BALL
  'Goku': 'https://static.wikia.nocookie.net/dragonball/images/5/5b/Goku_MUI.png',
  'Vegeta': 'https://static.wikia.nocookie.net/dragonball/images/8/8f/Vegeta_UE.png',

  // ATTACK ON TITAN
  'Eren': 'https://static.wikia.nocookie.net/shingekinokyojin/images/a/a7/Eren_Yeager_%28Anime%29_character_image.png',
  'Levi': 'https://static.wikia.nocookie.net/shingekinokyojin/images/3/3d/Levi_Ackermann_%28Anime%29_character_image.png',
  'Reiner': 'https://static.wikia.nocookie.net/shingekinokyojin/images/d/d9/Reiner_Braun_%28Anime%29_character_image.png',

  // MY HERO ACADEMIA
  'Shoto Todoroki': 'https://static.wikia.nocookie.net/bokunoheroacademia/images/4/4c/Shoto_Todoroki_Anime_Action.png',
  'Izuku Midoriya': 'https://static.wikia.nocookie.net/bokunoheroacademia/images/c/cd/Izuku_Midoriya_Anime_Action.png',
  'Bakugo': 'https://static.wikia.nocookie.net/bokunoheroacademia/images/6/61/Katsuki_Bakugo_Anime_Action.png',
  'Hanta Sero': 'https://static.wikia.nocookie.net/bokunoheroacademia/images/e/e8/Hanta_Sero_Anime_Action.png',

  // SOUL EATER
  'Tsubaki Nakatsukasa': 'https://static.wikia.nocookie.net/souleater/images/5/5a/Tsubaki_Anime.png',

  // BUNGO STRAY DOGS
  'Michizo Tachihara': 'https://static.wikia.nocookie.net/bungostraydogs/images/3/3e/Michizo_Tachihara_Anime.png',

  // THE WALLFLOWER
  'Sunako Nakahara': 'https://static.wikia.nocookie.net/yamato-nadeshiko-shichi-henge/images/8/8f/Sunako_Nakahara.png',

  // MAGI
  'Morgiana': 'https://static.wikia.nocookie.net/magi/images/f/f4/Morgiana_anime.png',
};

module.exports = {
  name: 'charinfo',
  description: 'View details of a character you own',
  async execute({ message, args, userData }) {
    const charName = args.join(' ').trim();

    if (!charName) {
      return message.channel.send('Usage: `.charinfo <character name>`');
    }

    const chars = userData.characters || [];
    
    // Case-insensitive search
    const char = chars.find(c => 
      c.name.toLowerCase().trim() === charName.toLowerCase().trim()
    );

    if (!char) {
      // Show helpful message with available characters
      if (chars.length === 0) {
        return message.channel.send(`❌ You don't own any characters yet! Use \`.roll\` to get one.`);
      }
      
      const ownedNames = chars.map(c => c.name).join(', ');
      return message.channel.send(
        `❌ You don't own **${charName}**.\n\nYour characters: ${ownedNames}`
      );
    }

    const movesText = char.moves.map(m => `• **${m.name}** (${m.damage})`).join('\n');

    // Get character image from CDN (case-insensitive lookup)
    const imageKey = Object.keys(characterImages).find(
      key => key.toLowerCase() === char.name.toLowerCase()
    );
    const imageUrl = imageKey ? characterImages[imageKey] : 'https://via.placeholder.com/300x400?text=No+Image';

    const embed = new EmbedBuilder()
      .setTitle(char.name)
      .setDescription(
        `**Series:** ${char.series}\n` +
        `**Tier:** ${char.tier}\n\n` +
        `**Moves:**\n${movesText}`
      )
      .setThumbnail(imageUrl)
      .setColor('#00BFFF')
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};
