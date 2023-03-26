const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { channelMention } = require('discord.js');

const MsgConstants = require('../msg-constants.js');

const { 
	discord_admin_inceptor_role_name,
	discord_channel_inceptors_role_name,
	discord_channel_challengers_role_name,
	discord_channel_pending_challengers_role_name,
	discord_channel_banned_role_name 
} = require('../config.json');

const MODAL_INCEPT_PREFIX = 'mdl_incept_vyklyk_{0}';
const MODAL_CHANNEL_INPUT_PREFIX = 'inp_channel_name_{0}_{1}';
const MODAL_TOPIC_INPUT_PREFIX = 'inp_channel_topic_{0}_{1}';
const MODAL_EMBED_INPUT_PREFIX = 'inp_embed_name_{0}_{1}';
const MODAL_INCEPTORS_INPUT_PREFIX = 'inp_inceptors_{0}_{1}';
const MODAL_ACCEPT_BUTTON_INPUT_PREFIX = 'inp_accept_btn_{0}_{1}';

// InceptionException error class;
class InceptionError extends Error {
	constructor(message) {
		super(message);
		this.name = 'InceptionException';
	}
}

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
			.setValue('æject leonid    gonpav1 sdfsdfm,     sdfsdf')
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

				// await i.followUp({ content: 'Yey!', ephemeral: true }); // Use this if i.deferUpdate(); in filter
				await i.reply({ content: 'Step 1 of N. Validating input. Please wait…', ephemeral: true }); // Use this if NO i.deferUpdate(); in filter

				const channelName = validateChannelName(i, i.fields.getTextInputValue(MODAL_CHANNEL_INPUT_ID));
				const embedObject = validateEmbed(i.fields.getTextInputValue(MODAL_EMBED_INPUT_ID));
				const acceptLabel = validateAcceptButton(i.fields.getTextInputValue(MODAL_ACCEPT_INPUT_ID));
				const inceptors = await getMembersByName(i, i.fields.getTextInputValue(MODAL_INCEPTORS_INPUT_ID), true);
			})
			.catch(err => {
				if (err instanceof InceptionError) {
					interaction.followUp({content: err.message, ephemeral: true});
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

function getChannelPermissionNames(channel) {
	return [
		MsgConstants.composeString(discord_channel_inceptors_role_name, channel.id),
		MsgConstants.composeString(discord_channel_challengers_role_name, channel.id),
		MsgConstants.composeString(discord_channel_pending_challengers_role_name, channel.id),
		MsgConstants.composeString(discord_channel_banned_role_name, channel.id)];
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
				channelMention(channel.id), getChannelPermissionNames(channel)));
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

async function getMembersByName(interaction, inceptorsNames, validate) {

	const members = [];
	if (inceptorsNames) {
		const nonMembers = [];
		const guildMembers = await interaction.guild.members.fetch(); // Save this in this.GuildMembers
		inceptorsNames.split(' ').filter(word => word !== '').forEach(inceptorName => {
			// console.log(inceptorName);
			// const member = await guildMembers.fetch({ query: 'gonpav' /*inceptorName*/ });
			// const member = interaction.guild.members.cache.find(mem => mem.user.username === inceptorName);
			const member = guildMembers.find(mem => mem.user.username === inceptorName);
			member ? members.push(member) : nonMembers.push(inceptorName);
		});
		if (validate && nonMembers.length > 0) {
			throw new InceptionError (MsgConstants.composeString('Error: cannot add these members as inceptors as they are not found on server: {0}', nonMembers));
		}
	}
	return members;
}