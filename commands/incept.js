const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const MsgConstants = require('../msg-constants.js');

const { discord_admin_inceptor_role_name } = require('../config.json');

const MODAL_INCEPT_PREFIX = 'mdl_incept_vyklyk_{0}';
const MODAL_CHANNEL_INPUT_PREFIX = 'inp_channel_name_{0}_{1}';
const MODAL_TOPIC_INPUT_PREFIX = 'inp_channel_topic_{0}_{1}';
const MODAL_EMBED_INPUT_PREFIX = 'inp_embed_name_{0}_{1}';
const MODAL_INCEPTORS_INPUT_PREFIX = 'inp_inceptors_{0}_{1}';
const MODAL_ACCEPT_BUTTON_INPUT_PREFIX = 'inp_accept_btn_{0}_{1}';

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

        const MODAL_INCEPT_ID = MsgConstants.composeString(MODAL_INCEPT_PREFIX, interaction.guild.id);
        const MDL_CREATE_VYKLYK_TITLE = MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_TITLE, interaction.locale);
		// await interaction.reply({ content: `All good ${MODAL_INCEPT_PREFIX_ID}`, ephemeral: true });

		// Create "Create Vyklyk" modal
		const modal = new ModalBuilder()
			.setCustomId(MODAL_INCEPT_ID)
			.setTitle(MDL_CREATE_VYKLYK_TITLE);

		// Add components to modal

		// Create the text input components
        const MODAL_CHANNEL_INPUT_ID = MsgConstants.composeString(MODAL_CHANNEL_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const channelNameInput = new TextInputBuilder()
			.setCustomId(MODAL_CHANNEL_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_CHANNEL_LABEL, interaction.locale))
            .setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_CHANNEL_PLACEHOLDER, interaction.locale))
			.setStyle(TextInputStyle.Short);

        const MODAL_TOPIC_INPUT_ID = MsgConstants.composeString(MODAL_TOPIC_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const channelTopicInput = new TextInputBuilder()
			.setCustomId(MODAL_TOPIC_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_TOPIC_LABEL, interaction.locale))
            .setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_TOPIC_PLACEHOLDER, interaction.locale))
			.setRequired(false)
			.setStyle(TextInputStyle.Paragraph);

		const MODAL_EMBED_INPUT_ID = MsgConstants.composeString(MODAL_EMBED_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const embedInput = new TextInputBuilder()
			.setCustomId(MODAL_EMBED_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_EMBED_LABEL, interaction.locale))
			.setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_EMBED_PLACEHOLDER, interaction.locale))
			.setStyle(TextInputStyle.Paragraph);

		const MODAL_INCEPTORS_INPUT_ID = MsgConstants.composeString(MODAL_INCEPTORS_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const inceptorsInput = new TextInputBuilder()
			.setCustomId(MODAL_INCEPTORS_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_INCEPTORS_LABEL, interaction.locale))
			.setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_INCEPTORS_PLACEHOLDER, interaction.locale))
			.setRequired(false)
			.setStyle(TextInputStyle.Short);

        const MODAL_ACCEPT_INPUT_ID = MsgConstants.composeString(MODAL_ACCEPT_BUTTON_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const acceptButtonNameInput = new TextInputBuilder()
			.setCustomId(MODAL_ACCEPT_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_ACCEPT_BTN_LABEL, interaction.locale))
            .setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_ACCEPT_BTN_PLACEHOLDER, interaction.locale))
			.setStyle(TextInputStyle.Short);

		// Add inputs to the modal
		modal.addComponents(
			new ActionRowBuilder().addComponents(channelNameInput),
			new ActionRowBuilder().addComponents(channelTopicInput),
			new ActionRowBuilder().addComponents(embedInput),
		 	new ActionRowBuilder().addComponents(inceptorsInput),
			new ActionRowBuilder().addComponents(acceptButtonNameInput),
			);

		// Show the modal to the user
        await interaction.showModal(modal);

        // As for Defer Update, then  see this post by Bing chat:
        // https://sl.bing.net/d3a9JTncd4e
        const filter = async i => {
            await i.deferUpdate();
            return i.customId === MODAL_INCEPT_ID && i.user.id === interaction.user.id;
        };

	},
};