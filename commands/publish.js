const { SlashCommandBuilder, channelMention, userMention } = require('discord.js');
const { VyklykManager } = require('../vyklyk-manager.js');
const { discord_admin_inceptor_role_name } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('publish')
		.setDescription('Publishes yet unpublished vyklyk')
		.addStringOption(option =>
			option.setName('vyklyk-id')
				.setDescription('Id of the channel under VYKLYKS category')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('unpublish')
				.setDescription('Type \'yes\' if you want to unpublished the vyklyk')
				.setRequired(false)),
	async execute(interaction) {

		try {
			await interaction.deferReply({ ephemeral: true });

			// const vyklykManager = new VyklykManager();
			const channelId = interaction.options.getString('vyklyk-id');
			const unpublish = (interaction.options.getString('unpublish') === 'yes');

			// Check: user is in Channel Inceptors role OR in Admin Inceptors role
			if (!VyklykManager.isMemberInceptor (interaction.member, channelId)) {
				return await interaction.followUp({
					content: `Error: you should be a member of '${VyklykManager.getChannelInceptorRoleName(channelId)}' or '${discord_admin_inceptor_role_name}' role to execute this slash command`,
					ephemeral: true });
			}

			const channel = await VyklykManager.getChannelById(interaction, channelId);

			// check: server is not published yet
			const vyklykPublished = await VyklykManager.isChannelPublished (channel);
			if (vyklykPublished !== unpublish) {
				return await interaction.followUp({
					content: `Warning: The vyklyk was already '${vyklykPublished ? 'published' : 'unpublished'}' before`,
					ephemeral: true });
			}
			// check: channel is under VYKLYKs category
			if (!VyklykManager.isVyklykChannel(interaction, channel)) {
				return await interaction.followUp({
					content: `Error: cannot publish ${channelMention(channelId)}. The channel should fall under '${VyklykManager.getVyklyksChannelCategory(interaction).name.toUpperCase()}' category`,
					ephemeral: true });
			}

			await VyklykManager.publishChannel (channel, !unpublish);

			const message = `vyklyk was ${unpublish ? 'unpublished' : 'published'} by ${userMention(interaction.user.id)}. The channel ${channelMention(channelId)} is now ${unpublish ? 'NOT' : ''} accessible to the public`;
			await interaction.followUp(`Success: the ${message}`);

			// Message in Internal thread
			await VyklykManager.tryNotifyInceptors(interaction, channel, `The ${message}`);
		}
		catch (err) {
			await interaction.followUp({ content: `Error: something went wrong: ${err.toString()}`, ephemeral: true });
		}
	},
};

