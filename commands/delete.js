const { SlashCommandBuilder } = require('discord.js');
const { ChannelType, PermissionsBitField, channelMention } = require('discord.js');

const MsgConstants = require('../msg-constants.js');

const { VyklykManager } = require('../vyklyk-manager.js');

const {
	discord_admin_inceptor_role_name,
	discord_channel_inceptors_role_name,
} = require('../config.json');

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
		const inceptorRoleName = MsgConstants.composeString(discord_channel_inceptors_role_name, channelId);
		if (!(interaction.member.roles.cache.some(role => role.name === inceptorRoleName))) {
			// Check Admin Inceptors permissions
			if (!(interaction.member.roles.cache.some(role => role.name === discord_admin_inceptor_role_name))) {
				return await interaction.followUp({
					content: `You should be a member of '${inceptorRoleName}' or '${discord_admin_inceptor_role_name}' role to execute this slash command`,
					ephemeral: true });
			}
		}

		const channel = await interaction.client.channels.fetch(channelId);//
		// const channel = await interaction.client.channels.cache.get(channelId);
		// If the channel is not found, return
		if (!channel) {
			return await interaction.followUp({
				content: `Error cannot find the channel with specified id. Please find and delete channel MANUALY and also delete all associated roles on server: ${VyklykManager.getChannelRolesNames(channelId)}`,
				ephemeral: true });
		}

		// check: server is not published yet
		if (await VyklykManager.channelIsPublished (interaction, channel)) {
			return await interaction.followUp({
				content: `The vyklyk was published. Cannot delete published channel. If you will try to delete it MANUALY, then also delete all associated roles on server: ${VyklykManager.getChannelRolesNames(channelId)}`,
				ephemeral: true });
		}
		// check: channel is under VYKLYKs category
		if (!VyklykManager.isVyklykChannel(interaction, channel)) {
			return await interaction.followUp({
				content: `Error: cannot delete ${channelMention(channelId)}. The channel should fall under '${VyklykManager.getVyklyksChannelCategory(interaction).name.toUpperCase()}' category`,
				ephemeral: true });
		}

		const channelName = channel.name;
		await VyklykManager.deleteChannel (interaction, channel);

		// interaction.guild is the object representing the Guild in which the command was run
		if (interaction.channel.id !== channelId) {
			await interaction.followUp(`SUCCESS: the channel '${channelName}' was deleted.\nPlease double check in server settings that following roles were deleted too: ${VyklykManager.getChannelRolesNames(channelId)}`);
		}
	},
};

