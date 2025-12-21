const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

// ================== CONFIG ==================
const SHOP_ADMIN_ROLE_ID = '1382513369801555988';

// Inventory storage key for Silv token (same as buy.js: item.name)
const SILV_TOKEN_KEY = 'Silv token';

// Core Silv token shop item (ITEM_ID used in `.shop buy silv_token`)
const SILV_TOKEN_ITEM = {
  id: 'silv_token',
  name: 'Silv token',
  priceCoins: 100000,
  emoji: '<:SILV_TOKEN:1447678878448484555>',
  description: 'A shiny coin for exchanging robux and more!',
  category: 'Currency',
  spawnChance: 80,
};

// ===== SHOP REFRESH (4 HOURS) =====
let shopCache = {
  lastRollTime: 0,
  itemsByCategory: {},
};
const SHOP_REFRESH_MS = 4 * 60 * 60 * 1000;

// ================== MODEL ==================
const shopItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  priceCoins: { type: Number, default: 0 },
  priceSilv: { type: Number, default: 0 },
  spawnChance: { type: Number, default: 100 },
  roleId: { type: String, default: null },
  roleDays: { type: Number, default: 0 }, // 0 = permanent
});

const ShopItem =
  mongoose.models.ShopItem || mongoose.model('ShopItem', shopItemSchema);

// ================== EXPORT COMMAND ==================
module.exports = {
  name: 'shop',
  description: 'Open the daily shop',
  async execute({ message, args, userData, saveUserData }) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'add') {
      return handleAddItem({ message, args: args.slice(1) });
    }

    if (sub === 'remove') {
      return handleRemoveItem({ message, args: args.slice(1) });
    }

    if (sub === 'buy') {
      return handleBuy({ message, args: args.slice(1), userData, saveUserData });
    }

    return showShop({ message });
  },
};

// ================== ADMIN: ADD ITEM ==================
// .shop add (name) (item_id) (category) (priceCoins) (priceSilv) (chance 0-100) [roleId] [roleDays]
// examples:
// .shop add mystery box mystery_box Mythical 0 3 10
// .shop add SILV MEMBER silv_member Exclusive 0 5 50 1452...5026 7
async function handleAddItem({ message, args }) {
  const member = message.member;
  if (!member.roles.cache.has(SHOP_ADMIN_ROLE_ID)) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ PERMISSION DENIED ‧₊˚✧')
      .setDescription('You **cannot** manage the shop.')
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  if (args.length < 6) {
    const embed = new EmbedBuilder()
      .setTitle('˗ˏˋ 📜 SHOP ADD USAGE ˎˊ˗')
      .setDescription(
        [
          '```',
          '.shop add (name) (item_id) (category) (priceCoins) (priceSilv) (chance 0-100) [roleId] [roleDays]',
          '',
          'Example:',
          '.shop add mystery box mystery_box Mythical 0 3 10',
          '.shop add SILV MEMBER silv_member Exclusive 0 5 50 1452178800459645026 7',
          '```',
        ].join('\n'),
      )
      .setColor('#f1c40f');
    return message.channel.send({ embeds: [embed] });
  }

  // We assume item_id is ONE word (no spaces).
  // So: take everything up to the item_id as name.
  const itemIdIndex = 1; // first arg after name
  const nameParts = args.slice(0, itemIdIndex);
  const rawName = nameParts.join(' ');

  const rawId = args[itemIdIndex];
  const rawCategory = args[itemIdIndex + 1];
  const rawPriceCoins = args[itemIdIndex + 2];
  const rawPriceSilv = args[itemIdIndex + 3];
  const rawChance = args[itemIdIndex + 4];
  const rawRoleId = args[itemIdIndex + 5] || null;
  const rawRoleDays = args[itemIdIndex + 6] || null;

  const name = rawName;
  const itemId = rawId.toLowerCase();
  const category = rawCategory;
  const priceCoins = Number(rawPriceCoins);
  const priceSilv = Number(rawPriceSilv);
  const spawnChance = Number(rawChance);
  const roleId = rawRoleId || null;
  const roleDays = rawRoleDays ? Number(rawRoleDays) : 0;

  if (Number.isNaN(priceCoins) || priceCoins < 0 || Number.isNaN(priceSilv) || priceSilv < 0) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ INVALID PRICE ‧₊˚✧')
      .setDescription('All prices must be **0 or positive numbers**.')
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  if (Number.isNaN(spawnChance) || spawnChance < 0 || spawnChance > 100) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ INVALID CHANCE ‧₊˚✧')
      .setDescription('Chance must be **0–100** (percent).')
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  if (rawRoleDays && (Number.isNaN(roleDays) || roleDays < 0)) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ INVALID ROLE TIME ‧₊˚✧')
      .setDescription('Role time must be **0 or a positive number of days**.')
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  const existing = await ShopItem.findOne({ itemId });
  if (existing || itemId === SILV_TOKEN_ITEM.id) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ ITEM ALREADY EXISTS ‧₊˚✧')
      .setDescription(`Item ID \`${itemId}\` is already in the shop.`)
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  const item = new ShopItem({
    itemId,
    name,
    category,
    priceCoins,
    priceSilv,
    spawnChance,
    roleId: roleId || null,
    roleDays,
  });

  await item.save();

  const embed = new EmbedBuilder()
    .setTitle('˗ˏˋ 𐙚 ✅ SHOP ITEM ADDED 𐙚 ˎˊ˗')
    .setDescription(
      [
        `**${name}** \`(${itemId})\``,
        '',
        `**Category**  »  ${category}`,
        `**Coins**     »  ${priceCoins.toLocaleString()} 💰`,
        `**Silv**      »  ${priceSilv} ${SILV_TOKEN_ITEM.emoji}`,
        `**Chance**    »  ${spawnChance}%`,
        roleId ? `**Role**      »  <@&${roleId}>` : '',
        roleId && roleDays
          ? `**Role time** »  ${roleDays} day(s)`
          : '',
      ].filter(Boolean).join('\n'),
    )
    .setColor('#2ecc71');
  return message.channel.send({ embeds: [embed] });
}

// ================== ADMIN: REMOVE ITEM ==================
async function handleRemoveItem({ message, args }) {
  const member = message.member;
  if (!member.roles.cache.has(SHOP_ADMIN_ROLE_ID)) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ PERMISSION DENIED ‧₊˚✧')
      .setDescription('You **cannot** manage the shop.')
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  const itemId = (args[0] || '').toLowerCase();
  if (!itemId) {
    const embed = new EmbedBuilder()
      .setTitle('˗ˏˋ 📜 SHOP REMOVE USAGE ˎˊ˗')
      .setDescription('``````')
      .setColor('#f1c40f');
    return message.channel.send({ embeds: [embed] });
  }

  if (itemId === SILV_TOKEN_ITEM.id) {
    const embed = new EmbedBuilder()
      .setTitle('🛡 PROTECTED ITEM')
      .setDescription('**Silv token** is a core shop item and **cannot** be removed.')
      .setColor('#e67e22');
    return message.channel.send({ embeds: [embed] });
  }

  const item = await ShopItem.findOne({ itemId });
  if (!item) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ ITEM NOT FOUND ‧₊˚✧')
      .setDescription(`No item with ID \`${itemId}\` exists in the shop.`)
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  await ShopItem.deleteOne({ itemId });

  const embed = new EmbedBuilder()
    .setTitle('˗ˏˋ 🗑 ITEM REMOVED ˎˊ˗')
    .setDescription(`**${item.name}** \`(${itemId})\` was removed from the shop.`)
    .setColor('#e74c3c');
  return message.channel.send({ embeds: [embed] });
}

// ================== BUY ==================
async function handleBuy({ message, args, userData, saveUserData }) {
  const itemId = (args[0] || '').toLowerCase();
  if (!itemId) {
    const embed = new EmbedBuilder()
      .setTitle('˗ˏˋ 📜 SHOP BUY USAGE ˎˊ˗')
      .setDescription('``````')
      .setColor('#f1c40f');
    return message.channel.send({ embeds: [embed] });
  }

  userData.inventory = userData.inventory || {};
  const coins = userData.balance || 0;
  const silv = userData.inventory[SILV_TOKEN_ITEM.name] || 0;

  // ---- BUY SILV TOKEN ----
  if (itemId === SILV_TOKEN_ITEM.id) {
    if (coins < SILV_TOKEN_ITEM.priceCoins) {
      const missing = SILV_TOKEN_ITEM.priceCoins - coins;
      const embed = new EmbedBuilder()
        .setTitle('✧˚₊‧ ✖ NOT ENOUGH COINS ‧₊˚✧')
        .setDescription(
          [
            `**Needed**   »  ${SILV_TOKEN_ITEM.priceCoins.toLocaleString()} 💰`,
            `**You have** »  ${coins.toLocaleString()} 💰`,
            `**Missing**  »  ${missing.toLocaleString()} 💰`,
          ].join('\n'),
        )
        .setColor('#e74c3c');
      return message.channel.send({ embeds: [embed] });
    }

    userData.balance = coins - SILV_TOKEN_ITEM.priceCoins;
    userData.inventory[SILV_TOKEN_ITEM.name] =
      (userData.inventory[SILV_TOKEN_ITEM.name] || 0) + 1;

    await saveUserData({
      balance: userData.balance,
      inventory: userData.inventory,
    });

    const embed = new EmbedBuilder()
      .setTitle('˗ˏˋ 𐙚 ✅ PURCHASE COMPLETE 𐙚 ˎˊ˗')
      .setDescription(
        `꒰ঌ You bought **1x** ${SILV_TOKEN_ITEM.emoji} **${SILV_TOKEN_ITEM.name}** ໒꒱`,
      )
      .addFields(
        {
          name: '💰 New Balance',
          value: `**${userData.balance.toLocaleString()}** coins`,
          inline: true,
        },
        {
          name: `${SILV_TOKEN_ITEM.emoji} Total Silv tokens`,
          value: `**${userData.inventory[SILV_TOKEN_ITEM.name]}x**`,
          inline: true,
        },
      )
      .setColor('#27ae60')
      .setTimestamp()
      .setFooter({ text: 'System • Shop' });

    return message.channel.send({ embeds: [embed] });
  }

  // ---- BUY NORMAL ITEM ----
  const item = await ShopItem.findOne({ itemId });
  if (!item) {
    const embed = new EmbedBuilder()
      .setTitle('✧˚₊‧ ✖ ITEM NOT FOUND ‧₊˚✧')
      .setDescription(`No item with ID \`${itemId}\` exists in the shop.`)
      .setColor('#e74c3c');
    return message.channel.send({ embeds: [embed] });
  }

  if (item.priceSilv > 0) {
    if (silv < item.priceSilv) {
      const missing = item.priceSilv - silv;
      const embed = new EmbedBuilder()
        .setTitle('✧˚₊‧ ✖ NOT ENOUGH SILV ‧₊˚✧')
        .setDescription(
          [
            `**Needed**   »  ${item.priceSilv} ${SILV_TOKEN_ITEM.emoji}`,
            `**You have** »  ${silv} ${SILV_TOKEN_ITEM.emoji}`,
            `**Missing**  »  ${missing} ${SILV_TOKEN_ITEM.emoji}`,
          ].join('\n'),
        )
        .setColor('#e74c3c');
      return message.channel.send({ embeds: [embed] });
    }

    userData.inventory[SILV_TOKEN_ITEM.name] =
      (userData.inventory[SILV_TOKEN_ITEM.name] || 0) - item.priceSilv;
  } else if (item.priceCoins > 0) {
    if (coins < item.priceCoins) {
      const missing = item.priceCoins - coins;
      const embed = new EmbedBuilder()
        .setTitle('✧˚₊‧ ✖ NOT ENOUGH COINS ‧₊˚✧')
        .setDescription(
          [
            `**Needed**   »  ${item.priceCoins.toLocaleString()} 💰`,
            `**You have** »  ${coins.toLocaleString()} 💰`,
            `**Missing**  »  ${missing.toLocaleString()} 💰`,
          ].join('\n'),
        )
        .setColor('#e74c3c');
      return message.channel.send({ embeds: [embed] });
    }
    userData.balance = coins - item.priceCoins;
  } else {
    const embed = new EmbedBuilder()
      .setTitle('⚠ NO PRICE SET')
      .setDescription('This item has **no price** configured.')
      .setColor('#f1c40f');
    return message.channel.send({ embeds: [embed] });
  }

  // Give role if needed (with optional expiry)
  if (item.roleId) {
    try {
      const member = await message.guild.members.fetch(message.author.id);
      const role = message.guild.roles.cache.get(item.roleId);
      if (role && !member.roles.cache.has(item.roleId)) {
        await member.roles.add(item.roleId);

        // If roleDays > 0, schedule removal
        if (item.roleDays && item.roleDays > 0) {
          const ms = item.roleDays * 24 * 60 * 60 * 1000;
          setTimeout(async () => {
            try {
              const freshMember = await message.guild.members.fetch(message.author.id);
              if (freshMember.roles.cache.has(item.roleId)) {
                await freshMember.roles.remove(item.roleId);
              }
            } catch (e) {
              console.error('Failed to remove timed role:', e);
            }
          }, ms);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  await saveUserData({
    balance: userData.balance,
    inventory: userData.inventory,
  });

  const embed = new EmbedBuilder()
    .setTitle('˗ˏˋ 𐙚 ✅ PURCHASE COMPLETE 𐙚 ˎˊ˗')
    .setDescription(
      `꒰ঌ You bought **1x** **${item.name}** \`(${item.itemId})\` ໒꒱`,
    )
    .addFields(
      {
        name: '💰 New Balance',
        value: `**${userData.balance.toLocaleString()}** coins`,
        inline: true,
      },
      {
        name: `${SILV_TOKEN_ITEM.emoji} Silv tokens`,
        value: `**${userData.inventory[SILV_TOKEN_ITEM.name] || 0}x**`,
        inline: true,
      },
      item.roleId
        ? {
            name: '👑 Role',
            value:
              item.roleDays && item.roleDays > 0
                ? `<@&${item.roleId}> for **${item.roleDays} day(s)**`
                : `<@&${item.roleId}> (permanent)`,
            inline: false,
          }
        : null,
    ).setColor('#27ae60')
    .setTimestamp()
    .setFooter({ text: 'System • Shop' });

  return message.channel.send({ embeds: [embed] });
}

// ================== VIEW SHOP (.shop) ==================
async function showShop({ message }) {
  const now = Date.now();

  if (!shopCache.lastRollTime || now - shopCache.lastRollTime >= SHOP_REFRESH_MS) {
    let items = await ShopItem.find({}).sort({ category: 1, name: 1 });

    items = items.filter(it => {
      if (it.spawnChance >= 100) return true;
      return Math.random() * 100 < it.spawnChance;
    });

    const byCategory = {};

    const silvRoll = Math.random() * 100;
    if (silvRoll < SILV_TOKEN_ITEM.spawnChance) {
      byCategory[SILV_TOKEN_ITEM.category] = byCategory[SILV_TOKEN_ITEM.category] || [];
      byCategory[SILV_TOKEN_ITEM.category].push({
        itemId: SILV_TOKEN_ITEM.id,
        name: SILV_TOKEN_ITEM.name,
        priceCoins: SILV_TOKEN_ITEM.priceCoins,
        priceSilv: 0,
        roleId: null,
        spawnChance: SILV_TOKEN_ITEM.spawnChance,
        roleDays: 0,
      });
    }

    for (const it of items) {
      byCategory[it.category] = byCategory[it.category] || [];
      byCategory[it.category].push(it.toObject());
    }

    shopCache.lastRollTime = now;
    shopCache.itemsByCategory = byCategory;
  }

  const byCategory = shopCache.itemsByCategory || {};

  const embed = new EmbedBuilder()
    .setTitle('˗ˏˋ 🛍  D A I L Y   S H O P  𐙚 ˎˊ˗')
    .setDescription(
      [
        '╭─────────── • ───────────╮',
        '**Use** `.shop buy ITEM_ID` **to purchase.**',
        `${SILV_TOKEN_ITEM.emoji} **Silv token** has an **80%** chance each refresh.`,
        '',
        '**Shop refreshes every 4 hours.**',
        '╰─────────── • ───────────╯',
      ].join('\n'),
    )
    .setColor('#9b59b6')
    .setThumbnail(message.guild.iconURL())
    .setTimestamp();

  const categoryEmojis = {
    Currency: '💰',
    Weapons: '⚔️',
    Armor: '🛡️',
    Roles: '👑',
    Skins: '🎨',
    Items: '📦',
    Cosmetics: '✨',
  };

  if (Object.keys(byCategory).length === 0) {
    embed.addFields({
      name: '🛒  TODAY\'S SHOP',
      value: '**Nothing spawned this cycle.**\nCome back after the next refresh.',
      inline: false,
    });

    embed.setFooter({
      text: 'Shop refreshes every 4 hours',
      iconURL: message.author.displayAvatarURL(),
    });

    return message.channel.send({ embeds: [embed] });
  }

  for (const [category, list] of Object.entries(byCategory)) {
    const emoji = categoryEmojis[category] || '📦';
    let value = '';

    for (const it of list) {
      const useSilv = it.priceSilv && it.priceSilv > 0;
      const priceText = useSilv
        ? `${it.priceSilv} ${SILV_TOKEN_ITEM.emoji}`
        : `${it.priceCoins.toLocaleString()} 💰`;
      const chanceText = `${it.spawnChance ?? 100}%`;
      const roleInfo =
        it.roleId &&
        (it.roleDays && it.roleDays > 0
          ? `\n> **Role**   »  <@&${it.roleId}> for **${it.roleDays} day(s)**`
          : `\n> **Role**   »  <@&${it.roleId}>`);

      value +=
        `\n**${it.name}** \`${it.itemId}\`\n` +
        `> **Price**  »  ${priceText}\n` +
        `> **Chance** »  ${chanceText}` +
        (roleInfo || '') +
        '\n';
    }

    embed.addFields({
      name: `${emoji}  ${category.toUpperCase()}`,
      value: value || 'No items spawned in this category.',
      inline: false,
    });
  }

  embed.setFooter({
    text: 'Shop refreshes every 4 hours',
    iconURL: message.author.displayAvatarURL(),
  });

  return message.channel.send({ embeds: [embed] });
}
