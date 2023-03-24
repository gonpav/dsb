const { SlashCommandBuilder } = require('discord.js');
const { discord_admin_inceptor_role_name } = require('../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('incept')
		.setDescription(`Allow user with '${discord_admin_inceptor_role_name}' role to create a vyklyk`),
	async execute(interaction) {

		// Check for Admin permissions

		// interaction.guild is the object representing the Guild in which the command was run
		// await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};