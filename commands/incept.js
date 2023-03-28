const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { channelMention } = require('discord.js');
const { discord_vyklyk_webhook, discord_admin_inceptor_role_name } = require('../config.json');

const MsgConstants = require('../msg-constants.js');
const BtnCommands = require('../btn-commands.js');
const { VyklykManager, InceptionError } = require('../vyklyk-manager.js');

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
			.setValue(getEmbedTextFromConfig())
			.setStyle(TextInputStyle.Paragraph);

		const MODAL_INCEPTORS_INPUT_ID = MsgConstants.composeString(MODAL_INCEPTORS_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const inceptorsInput = new TextInputBuilder()
			.setCustomId(MODAL_INCEPTORS_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_INCEPTORS_LABEL, interaction.locale))
			.setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_INCEPTORS_PLACEHOLDER, interaction.locale))
			.setRequired(false)
			// .setValue('æject leonid    gonpav1 sdfsdfm,     sdfsdf')
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
            // await i.deferUpdate();
            return i.customId === MODAL_INCEPT_ID && i.user.id === interaction.user.id;
        };
		interaction.awaitModalSubmit({ time: 600_000, filter })
			.then(async (i) => {

				const steps = 'N';
				// await i.followUp({ content: 'Yey!', ephemeral: true }); // Use this if i.deferUpdate(); in filter
				await i.reply({ content: `Step 1 of ${steps}. Validating input. Please wait…`, ephemeral: true }); // Use this if NO i.deferUpdate(); in filter

				const channelName = VyklykManager.validateChannelName(i, i.fields.getTextInputValue(MODAL_CHANNEL_INPUT_ID));
				const embedObject = VyklykManager.validateEmbed(i.fields.getTextInputValue(MODAL_EMBED_INPUT_ID));
				const acceptLabel = VyklykManager.validateAcceptButton(i.fields.getTextInputValue(MODAL_ACCEPT_INPUT_ID));
				const inceptors = await VyklykManager.getMembersByName(i, i.fields.getTextInputValue(MODAL_INCEPTORS_INPUT_ID), true);

				await i.followUp({ content: `Validation succeeded.\nStep 2 of ${steps}. Creating channel. Please wait…`, ephemeral: true }); 
				const channel = await VyklykManager.createChannel(interaction, channelName);

				await i.followUp({ content: `Channel ${channelMention(channel.id)} created.\nStep 3 of ${steps}. Setting up permissions. Please wait…`, ephemeral: true });
				await VyklykManager.createChannelRoles(interaction, channel);

				await i.followUp({ content: `All required roles and permissions created.\nStep 4 of ${steps}. Creating content. Please wait…`, ephemeral: true });
				postWebhook(i, channel, embedObject, acceptLabel);

				await i.followUp({ content: `Vyklyk content created successfully.\nStep 5 of ${steps}. Updating channel topic. Please wait…`, ephemeral: true });

			})
			.catch(async err => {
				if (err instanceof InceptionError) {
					await err.cleanup();
					await interaction.followUp({ content: err.message, ephemeral: true });
				}
				console.log(`${err.stack.toString()}`);
			});
	},
};

// Helper methods

function getEmbedTextFromConfig() {
	const fs = require('node:fs');
	const path = require('node:path');

	const vyklyksPath = path.join(__dirname, '..//vyklyks');
	const vyklykFiles = fs.readdirSync(vyklyksPath).filter(file => file.endsWith('.json'));

	for (const file of vyklykFiles) {
		return fs.readFileSync(path.join(vyklyksPath, file), 'utf8').toString();
	}
}

async function postWebhook(interaction, channel, vyklykData, acceptBtnLabel) {

	try {
		// Find a web-hook with channel-name-id. If not found then create one
		const webHookName = MsgConstants.composeString(discord_vyklyk_webhook, channel.id);
		const webHooks = await channel.fetchWebhooks();
		let webhookClient = webHooks ? webHooks.find(wh => wh.name === webHookName) : null;
		if (!webhookClient) {
			webhookClient = await channel.createWebhook({
				name: webHookName,
				avatar: vyklykData.avatar_url,
			});
		}
		// await interaction.followUp({ content: `Webhook id=${webhookClient.id} has been found or created for the channel ${channel.name}`, ephemeral: true });

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(BtnCommands.createVyklykRegisterButtonId(channel.id))
					.setLabel(acceptBtnLabel)
					.setStyle(ButtonStyle.Primary),
				);

		vyklykData.components = [row];
		await webhookClient.send(vyklykData);
	}
	catch (err) {
		throw new InceptionError (
			`Error: failed to post content to the channel.\nPlease check the channel manually. Use 'delete' command to delete the channel if required.\nError details: ${err.toString()}`);
	}
}