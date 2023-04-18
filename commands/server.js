const { SlashCommandBuilder } = require('discord.js');
const ReplitDB = require('../replitdb.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Some useful information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);

		const replitDB = new ReplitDB ();
		// await replitDB.empty();
		const dbdata = await replitDB.getAll();
		console.log(dbdata);
		await interaction.followUp({ content: `The data: ${JSON.stringify(dbdata)}`, ephemeral: true });
	},
};