const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { channelMention, userMention, ChannelType } = require('discord.js');
const {
	discord_vyklyk_webhook,
	discord_admin_inceptor_role_name,
	discord_thread_discussion_name,
	discord_thread_internal_inceptors
 } = require('../config.json');

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

				const steps = '7';
				// await i.followUp({ content: 'Yey!', ephemeral: true }); // Use this if i.deferUpdate(); in filter
				await i.reply({ content: `Step 1 of ${steps}. Validating input. Please wait…`, ephemeral: true }); // Use this if NO i.deferUpdate(); in filter

				const channelName = validateChannelName(i, i.fields.getTextInputValue(MODAL_CHANNEL_INPUT_ID));
				const embedObject = validateEmbed(i.fields.getTextInputValue(MODAL_EMBED_INPUT_ID));
				const acceptLabel = validateAcceptButton(i.fields.getTextInputValue(MODAL_ACCEPT_INPUT_ID));
				const inceptors = await VyklykManager.getMembersByName(i, i.fields.getTextInputValue(MODAL_INCEPTORS_INPUT_ID), true);

				await i.followUp({ content: `Validation succeeded.\nStep 2 of ${steps}. Creating channel. Please wait…`, ephemeral: true }); 
				const channel = await VyklykManager.createChannel(interaction, channelName);

				await i.followUp({ content: `Channel ${channelMention(channel.id)} created.\nStep 3 of ${steps}. Setting up permissions. Please wait…`, ephemeral: true });
				const roles = await VyklykManager.createChannelRoles(interaction, channel);

				await i.followUp({ content: `All required roles and permissions created.\nStep 4 of ${steps}. Creating content. Please wait…`, ephemeral: true });
				await postWebhook(channel, embedObject, acceptLabel);

				await i.followUp({ content: `Vyklyk content created successfully.\nStep 5 of ${steps}. Updating channel topic. Please wait…`, ephemeral: true });
				let errCount = 0;
				let err = await setChannelTopic(channel, i.fields.getTextInputValue(MODAL_TOPIC_INPUT_ID), true);
				if (err) {
					errCount++;
					await i.followUp({ content: `Non-critical Error: failed to add channel topic and/or pin the first message. Please do this manually. \nError details: ${err.toString()}\nStep 6 of ${steps}. Adding additional inceptors. Please wait…`, ephemeral: true });
				}
				else {
					await i.followUp({ content: `Channel topic updated successfully.\nStep 6 of ${steps}. Adding additional inceptors. Please wait…`, ephemeral: true });
				}

				let inceptorsAddedCount = inceptors.length;
				const inceptorRole = roles.find(x => x.name === VyklykManager.getChannelInceptorRoleName(channel.id));
				inceptors.forEach(async (inceptor) => {
					err = await VyklykManager.tryAddMemeberToRole(inceptor, inceptorRole);
					if (err) {
						errCount++;
						inceptorsAddedCount--;
						await i.followUp({ content: `Non-critical Error: failed to add '${inceptor.displayName}' to the role '${inceptorRole.name}'. Please do this manually. \nError details: ${err.toString()}`, ephemeral: true });
					}
				});

				await i.followUp({ content: `${inceptorsAddedCount} additional inceptors added.\nStep 7 of ${steps}. Creating additional threads. Please wait…`, ephemeral: true });
				await createDiscussionThread(i, channel);
				await createInceptorsInternalThread(channel, interaction.member, inceptors);

				if (errCount > 0) {
					await i.followUp({ content: `Vyklyk ${channelMention(channel.id)} was created with ${errCount} errors. Please go over 'Non-critical Error' messages for review.\nIf you would like to start over then we recommend to '/delete' this vyklyk first.`, ephemeral: true });
				}
				else {
					await i.followUp({ content: `Vyklyk ${channelMention(channel.id)} successfully created. It is not published yet for your review.`, ephemeral: true });
				}
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

function validateChannelName(interaction, channelName) {
	try {
		const MAX_CHANNEL_NAME_LENGTH = 100; // Max channel length in Discord is 100 chars, we stick to this value too
		if (!channelName || /\s/.test(channelName) || channelName.length > MAX_CHANNEL_NAME_LENGTH) {
			throw new InceptionError (`Error: please specify correct name of the channel without spaces and length up to ${MAX_CHANNEL_NAME_LENGTH} characters`);
		}
		const channel = interaction.client.channels.cache.find(c => c.name === channelName);
		if (channel) {
			throw new InceptionError(MsgConstants.composeString(
				'Error: channel with the name {0} already exists. If you do want to modify it, then do it manually signed in as “inceptor". If you want to delete it, then also delete all associated roles on server: {1}',
				channelMention(channel.id), VyklykManager.getChannelRolesNames(channel.id)));
		}
		return channelName;
	}
	catch (err) {
		if (err instanceof InceptionError) throw err;
		throw new InceptionError(`Error: failed to validate a channel with the name ${channelName}: ${err.toString()}`);
	}
}

function validateEmbed(embedJSON) {
	try {
		return JSON.parse(embedJSON);
	}
	catch (err) {
		throw new InceptionError('Error: entered Discohook text is not a valid JSON. Please double check that you entered it correctly from https://discohook.org');
	}
}

function validateAcceptButton(buttonLabel) {
	const MAX_BUTTON_LABEL_LENGTH = 80; // Max channel length in Discord is 80 chars, we stick to this value too
	if (!buttonLabel || buttonLabel.length > MAX_BUTTON_LABEL_LENGTH) {
		throw new InceptionError (`Error: max text length of the '${MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_ACCEPT_BTN_LABEL, null)}' is ${MAX_BUTTON_LABEL_LENGTH} characters`);
	}
	return buttonLabel;
}

async function postWebhook(channel, vyklykData, acceptBtnLabel) {

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

async function setChannelTopic(channel, topicText) {
	if (topicText && topicText.length > 0) {
		try {
			const messages = await channel.messages.fetch({ limit: 1 });
			const firstMessage = messages.first();
			await channel.setTopic(`${topicText} ${firstMessage.url}`);
			await channel.messages.pin(firstMessage);
		}
		catch (err) {
			return err;
		}
	}
	return null;
}

async function createDiscussionThread(interaction, channel) {
	try {
		const thread = await channel.threads.create({
			name: discord_thread_discussion_name,
			autoArchiveDuration: 60,
			type: ChannelType.PublicThread,
			reason: 'Open discussion thread for all participants',
		});
		// await thread.send(`@everyone who participates! Please join the discussion here!`);
		return null;
	}
	catch (err) {
		return err;
	}
}

async function createInceptorsInternalThread(channel, interactionMember, inceptors) {
	try {
		const thread = await channel.threads.create({
			name: discord_thread_internal_inceptors,
			autoArchiveDuration: 60,
			type: ChannelType.PrivateThread,
			reason: 'Dedicated thread for vyklyk administration',
		});
		await thread.members.add(interactionMember);
		inceptors.forEach(async (inceptor) => {
			// await VyklykManager.tryAddMemeberToRole(inceptor, inceptorRole);
			await thread.members.add(inceptor /* interaction.user.id */);
		});
		return null;
	}
	catch (err) {
		return err;
	}
}