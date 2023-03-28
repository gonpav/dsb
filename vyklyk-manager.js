const { ChannelType, PermissionsBitField } = require('discord.js');
const { channelMention } = require('discord.js');
const MsgConstants = require('./msg-constants.js');
const { 
    discord_vyklyks_category_name,
	discord_admin_inceptor_role_name,
	discord_channel_inceptors_role_name,
	discord_channel_inceptors_permissions,
	discord_channel_challengers_role_name,
	discord_channel_challengers_permissions,
	discord_channel_pending_challengers_role_name,
	discord_channel_pending_challengers_permissions,
	discord_channel_banned_role_name,
	discord_channel_banned_permissions
} = require('./config.json');


// InceptionException error class;
class InceptionError extends Error {
	#interaction;
	#deleteChannel;
	#roles;
	constructor(message, interaction = null, deleteChannel = null, roles = null) {
		super(message);
		this.name = 'InceptionException';
		this.#deleteChannel = deleteChannel;
		this.#interaction = interaction;
		this.#roles = roles;
	}
 	async cleanup(){
		if (this.#interaction && this.#deleteChannel) {
			try {
				// console.log('Outcomment deleting of the channel');
                if (this.#roles) {
				    this.#roles.forEach(x => this.#cleanupRole(x));
                }
				await this.#interaction.guild.channels.delete(this.#deleteChannel);
			}
			catch (err) {
				this.message = `${this.message}.\nFailed to delete channel on cleanup: ${err.toString()}`;
			}
		}
	}
	async #cleanupRole(role) {
		if (!role) return;
		try {
			await this.#interaction.guild.roles.delete(role);
		}
		catch (err) {
			this.message = `${this.message}.\nFailed to delete role '${role.name}' on cleanup. Please delete it MANUALLY: ${err.toString()}`;
		}		
	}
}

class VyklykManager {
    constructor () {}

    static validateChannelName(interaction, channelName) {
        try {
            const MAX_CHANNEL_NAME_LENGTH = 100; // Max channel length in Discord is 100 chars, we stick to this value too
            if (!channelName || /\s/.test(channelName) || channelName.length > MAX_CHANNEL_NAME_LENGTH) {
                throw new InceptionError (`Error: please specify correct name of the channel without spaces and length up to ${MAX_CHANNEL_NAME_LENGTH} characters`);
            }
            const channel = interaction.client.channels.cache.find(c => c.name === channelName);
            if (channel) {
                throw new InceptionError(MsgConstants.composeString(
                    'Error: channel with the name {0} already exists. If you do want to modify it, then do it manually signed in as “inceptor". If you want to delete it, then also delete all associated roles on server: {1}',
                    channelMention(channel.id), VyklykManager.getChannelPermissionRoleNames(channel.id)));
            }
            return channelName;
        }
        catch (err) {
            if (err instanceof InceptionError) throw err;
            throw new InceptionError(`Error: failed to validate a channel with the name ${channelName}: ${err.toString()}`);
        }
    }
    
    static validateEmbed(embedJSON) {
        try {
            return JSON.parse(embedJSON);
        }
        catch (err) {
            throw new InceptionError('Error: entered Discohook text is not a valid JSON. Please double check that you entered it correctly from https://discohook.org');
        }
    }
    
    static validateAcceptButton(buttonLabel) {
        const MAX_BUTTON_LABEL_LENGTH = 80; // Max channel length in Discord is 80 chars, we stick to this value too
        if (!buttonLabel || buttonLabel.length > MAX_BUTTON_LABEL_LENGTH) {
            throw new InceptionError (`Error: max text length of the '${MsgConstants.getMessage(MsgConstants.MDL_CREATE_VYKLYK_ACCEPT_BTN_LABEL, null)}' is ${MAX_BUTTON_LABEL_LENGTH} characters`);
        }
        return buttonLabel;
    }

    static async deleteChannel(interaction, channel) {
		if (interaction && channel) {
            const roles = await VyklykManager.getChannelRoles(interaction, channel);
            if (roles) {
                roles.forEach(x => this.deleteRole(interaction, x));
            }
            await interaction.guild.channels.delete(channel);
		}
    }

    static async getChannelRoles(interaction, channel) {
        const rolesNames = VyklykManager.getChannelPermissionRoleNames(channel.id);
        return /*await*/ interaction.guild.roles.cache.filter((role) => rolesNames.includes(role.name));
    }

    static async deleteRole(interaction, role) {
        if (!role) return;
        await interaction.guild.roles.delete(role);
    }

    static async channelIsPublished(interaction, channel) {
        // For now we just check if ViewChannel is open for everyone
        const published = await channel.permissionsFor(interaction.guild.id).has(PermissionsBitField.Flags.ViewChannel);
        console.log(`Published: ${published}`);
        return published;
    }
    
    static getChannelPermissionRoleNames(channelId) {
        return [
            MsgConstants.composeString(discord_channel_inceptors_role_name, channelId),
            MsgConstants.composeString(discord_channel_challengers_role_name, channelId),
            MsgConstants.composeString(discord_channel_pending_challengers_role_name, channelId),
            MsgConstants.composeString(discord_channel_banned_role_name, channelId)];
    }

    static getVyklyksChannelCategory (interaction) {
        return interaction.guild.channels.cache.find(x => 
            x.type === ChannelType.GuildCategory && x.name === discord_vyklyks_category_name );        
    }

    static isVyklykChannel (interaction, channel) {
        const vyklyksCategory =  VyklykManager.getVyklyksChannelCategory(interaction)
        return (channel.parent && channel.parent.id === vyklyksCategory.id); 
    }
}

module.exports = {
	InceptionError,
    VyklykManager
};

// Helper methods

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
				channelMention(channel.id), VyklykManager.getChannelPermissionRoleNames(channel.id)));
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
		const vyklyksCategory = VyklykManager.getVyklyksChannelCategory(interaction);
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
