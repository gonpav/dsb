const { SlashCommandBuilder, channelMention, userMention } = require('discord.js');
const { VyklykManager } = require('../vyklyk-manager.js');
const { discord_admin_inceptor_role_name } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('challenger')
		.setDescription('Applies operations to the challenger')
		.addStringOption(option =>
			option.setName('vyklyk-id')
				.setDescription('Id of the channel under VYKLYKS category')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('challenger-id')
				.setDescription('User id')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('command')
				.setDescription('Operation type')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('faceit')
				.setDescription('Faceit nickname. (Must be specified for \'add\' command)')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('decline-reason')
				.setDescription('Reason of a decline to particilate in the challenge. Will be sent to the challanger')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('ban')
				.setDescription('Use \'yes\' to ban the challenger from the channel')
				.setAutocomplete(true)
				.setRequired(false)),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'command') {
			choices = ['add', 'decline-applicant', 'delete-existing'];
		}

		if (focusedOption.name === 'ban') {
			choices = ['yes', 'no'];
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {

		try {
			await interaction.deferReply({ ephemeral: true });
		}
		catch (err) {
			await interaction.followUp({ content: `Error: something went wrong: ${err.toString()}`, ephemeral: true });
		}
	},
};

