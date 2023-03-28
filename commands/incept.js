const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ChannelType, PermissionsBitField } = require('discord.js');
const { channelMention } = require('discord.js');
const { discord_vyklyks_category_name } = require('../config.json');

const MsgConstants = require('../msg-constants.js');
const { VyklykManager, InceptionError } = require('../vyklyk-manager.js');

const {
	discord_admin_inceptor_role_name,
	discord_channel_inceptors_role_name,
	discord_channel_inceptors_permissions,
	discord_channel_challengers_role_name,
	discord_channel_challengers_permissions,
	discord_channel_pending_challengers_role_name,
	discord_channel_pending_challengers_permissions,
	discord_channel_banned_role_name,
	discord_channel_banned_permissions
} = require('../config.json');

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

				// await i.followUp({ content: 'Yey!', ephemeral: true }); // Use this if i.deferUpdate(); in filter
				await i.reply({ content: 'Step 1 of N. Validating input. Please wait…', ephemeral: true }); // Use this if NO i.deferUpdate(); in filter

				const channelName = validateChannelName(i, i.fields.getTextInputValue(MODAL_CHANNEL_INPUT_ID));
				const embedObject = validateEmbed(i.fields.getTextInputValue(MODAL_EMBED_INPUT_ID));
				const acceptLabel = validateAcceptButton(i.fields.getTextInputValue(MODAL_ACCEPT_INPUT_ID));
				const inceptors = await getMembersByName(i, i.fields.getTextInputValue(MODAL_INCEPTORS_INPUT_ID), true);

				await i.followUp({ content: 'Validation succeeded.\nStep 2 of N. Creating channel. Please wait…', ephemeral: true }); // Use this if NO i.deferUpdate(); in filter
				const channel = await createChannel(interaction, channelName);

				await i.followUp({ content: `Channel ${channelMention(channel.id)} created.\nStep 3 of N. Setting up permissions. Please wait…`, ephemeral: true }); // Use this if NO i.deferUpdate(); in filter
				await createChannelRoles(interaction, channel);
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
				channelMention(channel.id), VyklykManager.getChannelPermissionRoleNames(channel)));
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

// This function gets all members from the server first 
// and look for entered names. It is NOT using guild.members.cache
// so potentially it can be a problematic call in the future
async function getMembersByName(interaction, inceptorsNames, validate) {

	let members = [];
	if (inceptorsNames) {
		const nonMembers = [];
		const inceptorsInput = inceptorsNames.split(' ').filter(word => word !== '');
		if (inceptorsInput && inceptorsInput.length > 0) {
			try {
				const guildMembers = await interaction.guild.members.fetch(); // Save this in this.GuildMembers
				inceptorsInput.forEach(inceptorName => {
					const member = guildMembers.find(mem => (
						mem.displayName === inceptorName || 	 // GuildMemeber.displayName (which is the nickname on server)
						// mem.user.username === inceptorName || // This is probably not correct search option
						mem.user.tag === inceptorName 			 // user.tag (which is the unique user name)
					));
					member ? members.push(member) : nonMembers.push(inceptorName);
				});
			}
			catch (err) {
				throw new InceptionError (`Error: failed to access inceptors. Please try again without adding inceptors.\nError details: ${err.toString()}`);
			}
			if (validate && nonMembers.length > 0) {
				throw new InceptionError (MsgConstants.composeString('Error: cannot add these members as inceptors as they are not found on server: {0}', nonMembers));
			}
			// Remove duplicates
			members = members.filter((obj, index, self) => index === self.findIndex((t) => (t.id === obj.id)));
		}
	}
	return members;
}

// This is an update version of 'getMembersByName' that looks at cache
// first and then looks on server only for a specifiend member in case
// it is not found in cache. BUT: it sometimes throws Timeout ERROR!!!
async function getMembersByNameOptimized(interaction, inceptorsNames, validate) {

	let members = [];
	if (inceptorsNames) {
		const nonMembers = [];
		const inceptorsInput = inceptorsNames.split(' ').filter(word => word !== '');
		if (inceptorsInput && inceptorsInput.length > 0) {
			try {
				for (let i = 0; i < inceptorsInput.length; i++) {
					const inceptorName = inceptorsInput.at(i);
					// Watch cache first
					let member = interaction.guild.members.cache.find(mem => (
						mem.displayName === inceptorName || 	 // GuildMemeber.displayName (which is the nickname on server)
						// mem.user.username === inceptorName || // This is probably not correct search option
						mem.user.tag === inceptorName			 // user.tag (which is the unique user name)
					));
					if (!member) {
						// There are 2 PROBLEMs here:
						// 1) next call throws Timeout Error sometimes
						// 2) it assumes to check "mem.user.username === inceptorName" which is not what we want actually
						const fetchResult = await interaction.guild.members.fetch({ query: inceptorName, force: true });
						if (fetchResult && fetchResult.size > 0) {
							member = fetchResult.at(0);
						}
					}
					member ? members.push(member) : nonMembers.push(inceptorName);
				}
			}
			catch (err) {
				throw new InceptionError (`Error: failed to access inceptors. Please try again without adding inceptors.\nError details: ${err.toString()}`);
			}
			if (validate && nonMembers.length > 0) {
				throw new InceptionError (MsgConstants.composeString('Error: cannot add these members as inceptors as they are not found on server: {0}', nonMembers));
			}
			// Remove duplicates
			members = members.filter((obj, index, self) => index === self.findIndex((t) => (t.id === obj.id)));
		}
	}
	return members;
}

async function createChannel(interaction, channelName) {
	try {
		const vyklyksCategory = interaction.guild.channels.cache.find(x =>
			x.type === ChannelType.GuildCategory &&
			x.name === discord_vyklyks_category_name
			);
		const channel = await interaction.guild.channels.create({
			parent: vyklyksCategory,
			name: channelName,
			type: ChannelType.GuildText,
			permissionOverwrites: [
				{
					// Deny ViewChannel for @everybody
					id: interaction.guild.id,
					deny: [PermissionsBitField.Flags.ViewChannel],
				},
/* 				{
					// IMPORTANT: outcomment bellow if Vyklyk Bot is not Administrator (however it will not work)
					// Allow Vyklyk-Bot to manage roles and channel (to add channel roles later)
					id: interaction.guild.members.me.id,
					allow: [
						PermissionsBitField.Flags.ViewChannel, 
						PermissionsBitField.Flags.ManageChannels,
						PermissionsBitField.Flags.ManageGuild,   
						PermissionsBitField.Flags.ManageRoles,  // ONLY works when Vyklyk Bot is Administrator
						],
				},*/
			],
		});
		return channel;
	}
	catch (err) {
		throw new InceptionError (`Error: failed to create a channel with the name: ${channelName}.\nError details: ${err.toString()}`);
	}
}

async function createChannelRoles(interaction, channel) {
	const roles = [];
	try {
		// discord_channel_inceptors_role_name,
		let role = await interaction.guild.roles.create({ name: MsgConstants.composeString(discord_channel_inceptors_role_name, channel.id.toString()), permissions: new PermissionsBitField(0n) });	
		roles.push(role);
		await channel.permissionOverwrites.create(role.id, discord_channel_inceptors_permissions);
		// add interaction member to inceptors_role
		interaction.member.roles.add(role);

		// discord_channel_challengers_role_name
		role = await interaction.guild.roles.create({ name: MsgConstants.composeString(discord_channel_challengers_role_name, channel.id.toString()), permissions: new PermissionsBitField(0n) });	
		roles.push(role);	
		await channel.permissionOverwrites.create(role.id, discord_channel_challengers_permissions);

		// discord_channel_pending_challengers_role_name
		role = await interaction.guild.roles.create({ name: MsgConstants.composeString(discord_channel_pending_challengers_role_name, channel.id.toString()), permissions: new PermissionsBitField(0n) });	
		roles.push(role);	
		await channel.permissionOverwrites.create(role.id, discord_channel_pending_challengers_permissions);

		// discord_channel_banned_role_name
		role = await interaction.guild.roles.create({ name: MsgConstants.composeString(discord_channel_banned_role_name, channel.id.toString()), permissions: new PermissionsBitField(0n) });	
		roles.push(role);	
		await channel.permissionOverwrites.create(role.id, discord_channel_banned_permissions);

		return roles;
	} 
	catch (err) {
		throw new InceptionError (
			`Error: failed to setup permissions for the channel.\nError details: ${err.toString()}`,
			interaction, channel, roles);
	}
}
