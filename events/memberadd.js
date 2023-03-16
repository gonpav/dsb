// Here is a possible JS code that listens to guildMemberAdd event and
// shows the welcome message with image and one button in channel
// called “welcome-new-members”:

const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { AuditLogEvent } = require('discord.js');

// Server invite: https://discord.gg/NfwJtWer
// winall-vyklyk channel invite: https://discord.gg/hGUpjZfj

async function fetchLogs(member) {
  try {
    const auditLogLimit = 100;
    const fetchedLogs = await member.guild.fetchAuditLogs({
      type: AuditLogEvent.InviteCreate,
      limit: auditLogLimit,
    });
    const inviteLog = fetchedLogs.entries.first();
    if (!inviteLog) return console.log('No invite logs found.');

    const { executor, target } = inviteLog;
    console.log(`${member.user.tag} joined using an invite created by ${executor.tag}.`);
  }
  catch (err) {
    console.error(err);
  }
}
async function welcomeNewMemberInWelcomeChannel(member) {

  fetchLogs(member);
  // Find the channel called "welcome-new-members"
  const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome-new-members');
  // If the channel is not found, return
  if (!channel) return;

  const row = new ActionRowBuilder()
      .addComponents(
            new ButtonBuilder()
              .setCustomId('primary')
              .setLabel('Click me!')
              .setStyle(ButtonStyle.Primary),
          );

  // const description = (`Hello ${member}, we are glad to have you here! Please read the rules and enjoy your stay.`);
  const description = 'Hello my friend, we are glad to have you here! Please read the rules and enjoy your stay.';
  const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`Welcome to ${member.guild.name}!`)
      // .setURL('https://discord.js.org')
      .setImage('https://cdn.discordapp.com/attachments/1083584210473861232/1083586103329689720/istockphoto-493449709-1024x1024.jpg')
      .setDescription(description);

  await channel.send({
    // content: 'I think you should,',
    components: [row],
    embeds: [embed],
    // ephemeral: true // ephemeral does not work here
  });
}

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
    welcomeNewMemberInWelcomeChannel(member);
      // // Find the channel called "welcome-new-members"
      // const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome-new-members');
      // // If the channel is not found, return
      // if (!channel) return;

      // const row = new ActionRowBuilder()
      //     .addComponents(
      //           new ButtonBuilder()
      //             .setCustomId('primary')
      //             .setLabel('Click me!')
      //             .setStyle(ButtonStyle.Primary)
      //         );

      // // const description = (`Hello ${member}, we are glad to have you here! Please read the rules and enjoy your stay.`);
      // const description = 'Hello my friend, we are glad to have you here! Please read the rules and enjoy your stay.';
      // const embed = new EmbedBuilder()
      //     .setColor(0x0099FF)
      //     .setTitle(`Welcome to ${member.guild.name}!`)
      //     // .setURL('https://discord.js.org')
      //     .setImage('https://cdn.discordapp.com/attachments/1083584210473861232/1083586103329689720/istockphoto-493449709-1024x1024.jpg')
      //     .setDescription(description);

      // await channel.send({
      //   // content: 'I think you should,',
      //   components: [row],
      //   embeds: [embed],
      //   // ephemeral: true // ephemeral does not work here
      // });

      // await interaction.reply({ content: 'I think you should,', components: [row] });
/*
      // Create a new action row with one button
      const row = new MessageActionRow()
        .addComponents(
          // Create a new button with primary style and custom ID
          new MessageButton()
            .setStyle('PRIMARY')
            .setLabel('Say hello')
            .setCustomId('hello_btn'));
      // Create a new embed with title, description and image
      const embed = new MessageEmbed()
        .setTitle(`Welcome to ${member.guild.name}!`)
        .setDescription(`Hello ${member}, we are glad to have you here! Please read the rules and enjoy your stay.`)
        .setImage('https://cdn.discordapp.com/attachments/1083584210473861232/1083585620317851690/contributor-01m.jpg');
      // Send the embed and the row as components to the channel
      await channel.send({ embeds: [embed], components: [row] });
*/
	},
};