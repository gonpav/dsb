const { SlashCommandBuilder, channelMention } = require('discord.js');
const { VyklykManager } = require('../vyklyk-manager.js');
const { discord_admin_inceptor_role_name } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes yet unpublished vyklyk')
		.addStringOption(option =>
			option.setName('vyklyk-id')
				.setDescription('Id of the channel under VYKLYKS category')
				.setRequired(true)),
	async execute(interaction) {

		await interaction.deferReply({ ephemeral: true });

		// const vyklykManager = new VyklykManager();
		const channelId = interaction.options.getString('vyklyk-id');

		// Check: user is in Channel Inceptors role OR in Admin Inceptors role
		if (!VyklykManager.isMemberInceptor (interaction.member, channelId)) {
			return await interaction.followUp({
				content: `Error: you should be a member of '${VyklykManager.getChannelInceptorRoleName(channelId)}' or '${discord_admin_inceptor_role_name}' role to execute this slash command`,
				ephemeral: true });
		}

		const channel = await interaction.client.channels.fetch(channelId);//
		// const channel = await interaction.client.channels.cache.get(channelId);
		// If the channel is not found, return
		if (!channel) {
			return await interaction.followUp({
				content: `Error: cannot find the channel with specified id. Please find and delete channel MANUALY and also delete all associated roles on server: ${VyklykManager.getChannelRolesNames(channelId)}`,
				ephemeral: true });
		}

		// check: server is not published yet
		if (await VyklykManager.isChannelPublished (channel)) {
			return await interaction.followUp({
				content: `Error: the vyklyk is published. Cannot delete published channel. If you will try to delete it MANUALY, then also delete all associated roles on server: ${VyklykManager.getChannelRolesNames(channelId)}`,
				ephemeral: true });
		}
		// check: channel is under VYKLYKs category
		if (!VyklykManager.isVyklykChannel(interaction, channel)) {
			return await interaction.followUp({
				content: `Error: cannot delete ${channelMention(channelId)}. The channel should fall under '${VyklykManager.getVyklyksChannelCategory(interaction).name.toUpperCase()}' category`,
				ephemeral: true });
		}

		const channelName = channel.name;
		const interactionChannelId = interaction.channel.id;
		await VyklykManager.deleteChannel (interaction, channel);

		// interaction.guild is the object representing the Guild in which the command was run
		if (interactionChannelId !== channelId) {
			await interaction.followUp(`Success: the channel '${channelName}' was deleted.\nPlease double check in server settings that following roles were deleted too: ${VyklykManager.getChannelRolesNames(channelId)}`);
		}
	},
};

