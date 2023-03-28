const { SlashCommandBuilder } = require('discord.js');
const { ChannelType, PermissionsBitField } = require('discord.js');

const MsgConstants = require('../msg-constants.js');

const { VyklykManager, InceptionError } = require('../vyklyk-manager.js');

const { 
	discord_admin_inceptor_role_name,
	discord_channel_inceptors_role_name,
	discord_vyklyks_category_name
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

		// const vyklykManager = new VyklykManager();
		const channelId = interaction.options.getString('vyklyk-id');

		// Check: user is in Channel Inceptors role OR in Admin Inceptors role
		const inceptorRoleName = MsgConstants.composeString(discord_channel_inceptors_role_name, channelId);
		if (!(interaction.member.roles.cache.some(role => role.name === inceptorRoleName))) {
			// Check Admin Inceptors permissions
			if (!(interaction.member.roles.cache.some(role => role.name === discord_admin_inceptor_role_name))) {
				return await interaction.reply({
					content: `You should be a member of '${inceptorRoleName}' or '${discord_admin_inceptor_role_name}' role to execute this slash command`,
					ephemeral: true });
			}
		}

		const channel = await interaction.client.channels.fetch(channelId);//
		// const channel = await interaction.client.channels.cache.get(channelId);
		// If the channel is not found, return
		if (!channel) {
			return await interaction.reply({
				content: `Error cannot find the channel with specified id. Please find and delete channel MANUALY and also delete all associated roles on server: '${VyklykManager.getChannelPermissionRoleNames(channel)}'`,
				ephemeral: true });
		}

		// check: server is not published yet
		if (await VyklykManager.channelIsPublished (interaction, channel)) {
			return await interaction.reply({
				content: `The vyklyk was published. Cannot delete published channel. If you will try to delete it MANUALY, then also delete all associated roles on server: '${VyklykManager.getChannelPermissionRoleNames(channel)}'`,
				ephemeral: true });
		}
		// check: channel is under VYKLYKs category

		await VyklykManager.deleteChannel (interaction, channel);

		// interaction.guild is the object representing the Guild in which the command was run
		if (interaction.channel.id !== channelId) {
			await interaction.reply('The channel was successfully deleted');
		}
	},
};

