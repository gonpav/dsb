const { SlashCommandBuilder, inlineCode, underscore, italic } = require('discord.js');
const { VyklykManager } = require('../vyklyk-manager.js');
const { ChallengerStatus } = require ('../vyklyk.js');

const ReplitDB = require('../replitdb.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('users')
		.setDescription('Some useful information about vyklyk members.')
		.addStringOption(option =>
			option.setName('vyklyk-id')
				.setDescription('Id of the channel under CHALLENGES category')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('category')
				.setDescription('Select category of users')
				.setAutocomplete(true)
				.setRequired(true)),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'category') {
			choices = ['all', 'inceptors', 'applicants', 'challengers', 'declined' /* , 'backers', 'followers', 'winners' */];
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {

		try {
			await interaction.deferReply({ ephemeral: true });
			const channelId = interaction.options.getString('vyklyk-id');

			// Check: user is in Channel Inceptors role OR in Admin Inceptors role
			if (!VyklykManager.isMemberInceptor (interaction.member, channelId)) {
				return await interaction.followUp({
					content: `Error: you should be a member of '${VyklykManager.getChannelInceptorRoleName(channelId)}' or '${discord_admin_inceptor_role_name}' role to execute this slash command`,
					ephemeral: true });
			}

			// eslint-disable-next-line no-inner-declarations
			function summaryMessage(allUsers, status, messageTitle) {
				const filteredUsers = allUsers.filter(user => user.status === status);
				if (filteredUsers.length === 0) return null;
				let message = `${underscore(messageTitle)}: ${filteredUsers.length}\n`;
				filteredUsers.forEach(user => {
					message += `Name: ${inlineCode(user.name)}, Faceit: ${inlineCode(user.faceitName)}, Language: ${inlineCode(user.locale)}\n`;
				});
				return message;
			}

			const category = interaction.options.getString('category');
			if (category === 'all') {
				const allUsers = await VyklykManager.getChallengersDBEntries(channelId);
				await interaction.followUp({ content: `...${italic('here are the results')}...`, ephemeral: true });

				let message = summaryMessage(allUsers, ChallengerStatus.Pending, 'Pending applicants');
				message == null ? null : await interaction.followUp({ content: message, ephemeral: true });

				message = summaryMessage(allUsers, ChallengerStatus.Approved, 'Approved challengers');
				message == null ? null : await interaction.followUp({ content: message, ephemeral: true });

				message = summaryMessage(allUsers, ChallengerStatus.Declined, 'Declined users');
				message == null ? null : await interaction.followUp({ content: message, ephemeral: true });
			}
			else if (category === 'inceptors') {
				await interaction.followUp({ content: `...${italic('not yet implemented')}...`, ephemeral: true });
			}
			else if (category === 'applicants') {
				const allUsers = await VyklykManager.getChallengersDBEntries(channelId);
				let message = summaryMessage(allUsers, ChallengerStatus.Pending, 'Pending applicants');
				message = message === null ? 'No pending applicants found' : message;
				await interaction.followUp({ content: message, ephemeral: true });
			}
			else if (category === 'challengers') {
				const allUsers = await VyklykManager.getChallengersDBEntries(channelId);
				let message = summaryMessage(allUsers, ChallengerStatus.Approved, 'Approved challengers');
				message = message === null ? 'No approved challengers found' : message;
				await interaction.followUp({ content: message, ephemeral: true });
			}
			else if (category === 'declined') {
				const allUsers = await VyklykManager.getChallengersDBEntries(channelId);
				let message = summaryMessage(allUsers, ChallengerStatus.Declined, 'Declined users');
				message = message === null ? 'No declined users found' : message;

				// TODO: add information about banned users also
				await interaction.followUp({ content: message, ephemeral: true });
			}
		}
		catch (err) {
			await interaction.followUp({ content: `${err.toString()}`, ephemeral: true });
		}
	},
};