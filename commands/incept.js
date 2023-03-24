const { SlashCommandBuilder } = require('discord.js');
const { discord_admin_inceptor_role_name } = require('../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('incept')
		.setDescription(`Allow user with '${discord_admin_inceptor_role_name}' role to create a vyklyk`),
	async execute(interaction) {

		// Check for Admin permissions
		if (!(interaction.member.roles.cache.some(role => role.name === discord_admin_inceptor_role_name))) {
			return await interaction.reply({
				content: `You should be a member of '${discord_admin_inceptor_role_name}' role to execute this slash command`,
				ephemeral: true });
		}

		await interaction.reply({ content: 'All good', ephemeral: true });

		// interaction.guild is the object representing the Guild in which the command was run
		// await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};