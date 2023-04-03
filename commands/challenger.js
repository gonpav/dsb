const { SlashCommandBuilder, channelMention, userMention, inlineCode } = require('discord.js');
const { VyklykManager } = require('../vyklyk-manager.js');
const MsgConstants = require('../msg-constants.js');
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
				.setDescription('Faceit nickname. (Must be specified for \'approve-applicant\' command)')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('decline-reason')
				.setDescription('Reason of a decline to particilate in the challenge. Will be sent to the challanger')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('ban')
				.setDescription('Use \'yes\' to ban the challenger from the channel')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('locale')
				.setDescription('To reply in user`s language please enter his/her locale as specified during submission')
				.setRequired(false)),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'command') {
			choices = ['approve-applicant', 'decline-applicant', 'delete-existing'];
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
			const channelId = interaction.options.getString('vyklyk-id');

			// Check: user is in Channel Inceptors role OR in Admin Inceptors role
			if (!VyklykManager.isMemberInceptor (interaction.member, channelId)) {
				return await interaction.followUp({
					content: `Error: you should be a member of '${VyklykManager.getChannelInceptorRoleName(channelId)}' or '${discord_admin_inceptor_role_name}' role to execute this slash command`,
					ephemeral: true });
			}

			const channel = await VyklykManager.getChannelById(interaction, channelId);
			const challengerId = interaction.options.getString('challenger-id');
			const challenger = await VyklykManager.getMemberById(interaction, challengerId);
			const locale = interaction.options.getString('locale');

			const command = interaction.options.getString('command');
			if (command === 'approve-applicant') {
				const faceitNickname = interaction.options.getString('faceit');
				if (!faceitNickname) {
					return await interaction.followUp({ content: 'Error: faceit nickname should be specified for the \'approve-applicant\' command', ephemeral: true });
				}

				// TODO : add challenger to the Database 
				// change role
				await VyklykManager.addMemberToChallengers(interaction, challenger, channelId, true, true);
				// send message
				let message = MsgConstants.getMessage(
					MsgConstants.MSG_REGISTRATION_APPROVED,
					locale ? locale : 'en-US' /* interaction.locale */,
					userMention(challengerId),
					channelMention(channelId),
					`<#${VyklykManager.getDiscussionThread(channel).id}>`); // this works better than this: channelMention(VyklykManager.getDiscussionThread(channel).id)

				// Send a message to the challenger
				await challenger.send(message);
				await interaction.followUp({ content: 'Challenger approved and notified!', ephemeral: true });

				message = `the Discord user ${inlineCode(challenger.displayName)} / (${inlineCode(challenger.user.tag)}) with 'challenger-id': ${inlineCode(challengerId)} and 'Faceit': ${inlineCode(faceitNickname)} was approved as a challenger by ${userMention(interaction.user.id)}. \nPlease make an update in channel with user statistics using ${inlineCode('FaceitFinder')} bot`;
				await VyklykManager.tryNotifyInceptors(interaction, channel, message);
			}
			else if (command === 'decline-applicant') {
				const declineReason = interaction.options.getString('decline-reason');
				if (!declineReason) {
					return await interaction.followUp({ content: 'Error: decline reason should be specified for the \'decline-applicant\' command', ephemeral: true });
				}

				// TODO : todo Decline
				const toban = (interaction.options.getString('ban') === 'yes');
				console.log(toban);
				await interaction.followUp({ content: 'Declined', ephemeral: true });
			}
			else if (command === 'delete-existing') {
				// TODO : todo Delete existing
				const toban = (interaction.options.getString('ban') === 'yes');
				console.log(toban);
				await interaction.followUp({ content: 'Deleted', ephemeral: true });
			}
		}
		catch (err) {
			await interaction.followUp({ content: `${err.toString()}`, ephemeral: true });
		}
	},
};

