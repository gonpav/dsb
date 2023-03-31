const { ChannelType, PermissionsBitField, roleMention } = require('discord.js');
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
	discord_channel_banned_permissions,
    discord_thread_discussion_name,
    discord_thread_internal_inceptors,
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

    async cleanup() {
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

// Main class to manage vyklyks on Discord server
class VyklykManager {
    constructor() {
        // We leave it empty for now
    }

    // This function gets all members from the server first
    // and look for entered names. It is NOT using guild.members.cache
    // so potentially it can be a problematic call in the future
    static async getMembersByName(interaction, inceptorsNames, validate) {

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
    static async getMembersByNameOptimized(interaction, inceptorsNames, validate) {

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

    static async createChannel(interaction, channelName) {
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

    static async createChannelRoles(interaction, channel) {
        const roles = [];
        try {
            // discord_channel_inceptors_role_name,
            let role = await interaction.guild.roles.create({ name: MsgConstants.composeString(discord_channel_inceptors_role_name, channel.id.toString()), permissions: new PermissionsBitField(0n) });
            roles.push(role);
            await channel.permissionOverwrites.create(role.id, discord_channel_inceptors_permissions);
            // add interaction member to inceptors_role
            VyklykManager.tryAddMemeberToRole(interaction.member, role);

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

    static async deleteChannel(interaction, channel) {
		if (interaction && channel) {
            const roles = await VyklykManager.getChannelRoles(interaction, channel);
            if (roles) {
                roles.forEach(x => this.deleteRole(interaction, x));
            }
            await interaction.guild.channels.delete(channel);
		}
    }

    static async tryAddMemeberToRole(member, role, safe = true) {
        try {
            await member.roles.add(role);
            return null;
        }
        catch (err) {
            if (!safe) throw err;
            return err;
        }
    }

    static async addMemeberToRoleByName(interaction, member, channelId, roleNamePrefix) {
        const roleName = MsgConstants.composeString(roleNamePrefix, channelId);
        const role = interaction.guild.roles.cache.find(x => x.name === roleName);
        return await VyklykManager.tryAddMemeberToRole(member, role, false);
    }

    static async getChannelRoles(interaction, channel) {
        const rolesNames = VyklykManager.getChannelRolesNames(channel.id);
        return /* await*/ interaction.guild.roles.cache.filter((role) => rolesNames.includes(role.name));
    }

    static async deleteRole(interaction, role) {
        if (!role) return;
        await interaction.guild.roles.delete(role);
    }

    static getChannelRolesNames(channelId) {
        return [
            MsgConstants.composeString(discord_channel_inceptors_role_name, channelId),
            MsgConstants.composeString(discord_channel_challengers_role_name, channelId),
            MsgConstants.composeString(discord_channel_pending_challengers_role_name, channelId),
            MsgConstants.composeString(discord_channel_banned_role_name, channelId)];
    }

    static getChannelInceptorRoleName(channelId) {
        return MsgConstants.composeString(discord_channel_inceptors_role_name, channelId);
    }

    static isMemberInRole(member, roleName) {
        return (member.roles.cache.some(role => role.name === roleName));
    }

    static isMemberInceptor(member, channelId, checkAdminInceptor = true) {
		const inceptorRoleName = VyklykManager.getChannelInceptorRoleName(channelId);

        // if (!(member.roles.cache.some(role => role.name === inceptorRoleName))) {
        if (!VyklykManager.isMemberInRole(member, inceptorRoleName)) {
			// Check Admin Inceptors permissions
			if (checkAdminInceptor && !(member.roles.cache.some(role => role.name === discord_admin_inceptor_role_name))) {
				return false;
			}
		}
        return true;
    }

    static isMemberChallenger(member, channelId) {
        const roleName = MsgConstants.composeString(discord_channel_challengers_role_name, channelId);
        return VyklykManager.isMemberInRole(member, roleName);
    }

    static isMemberPendingChallenger(member, channelId) {
        const roleName = MsgConstants.composeString(discord_channel_pending_challengers_role_name, channelId);
        return VyklykManager.isMemberInRole(member, roleName);
    }

    static async addMemberToPendingChallengers(interaction, member, channelId) {
        return VyklykManager.addMemeberToRoleByName(interaction, member, channelId, discord_channel_pending_challengers_role_name);
    }

    static isMemberBanned(member, channelId) {
        const roleName = MsgConstants.composeString(discord_channel_banned_role_name, channelId);
        return VyklykManager.isMemberInRole(member, roleName);
    }

    static getVyklyksChannelCategory(interaction) {
        return interaction.guild.channels.cache.find(x =>
            x.type === ChannelType.GuildCategory && x.name === discord_vyklyks_category_name);
    }

    static isVyklykChannel(interaction, channel) {
        const vyklyksCategory = VyklykManager.getVyklyksChannelCategory(interaction);
        return (channel.parent && channel.parent.id === vyklyksCategory.id);
    }

    static async isChannelPublished(channel) {
        // For now we just check if ViewChannel is open for everyone
        return await channel.permissionsFor(channel.guild.id).has(PermissionsBitField.Flags.ViewChannel);
    }

    static async publishChannel(channel, publish = true /* pass 'false' to unpublish */) {
        const published = VyklykManager.isChannelPublished(channel);
        if (published != publish) {
            await channel.permissionOverwrites.create(channel.guild.roles.everyone, { ViewChannel: publish });
        }
    }

    static async createDiscussionThread(channel, reason) {
        return await channel.threads.create({
			name: discord_thread_discussion_name,
			autoArchiveDuration: 60,
			type: ChannelType.PublicThread,
			reason: reason,
		});
    }

    static async createInceptorsInternalThread(channel, inceptors) {
        const thread = await channel.threads.create({
            name: discord_thread_internal_inceptors,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: 'Dedicated thread for vyklyk administration',
        });
        inceptors.forEach(async (inceptor) => {
            // await VyklykManager.tryAddMemeberToRole(inceptor, inceptorRole);
            await thread.members.add(inceptor /* interaction.user.id */);
        });
        // delete last message
        const messages = await channel.messages.fetch({ limit: 1 });
        await channel.bulkDelete(messages);
        return thread;
    }

    static async tryNotifyInceptors(interaction, channel, message) {
        try {
            // Message in Internal thread
            const thread = channel.threads.cache.find(x => x.name === discord_thread_internal_inceptors);
            if (thread) {
                const roleName = MsgConstants.composeString(discord_channel_inceptors_role_name, channel.id);
                const role = interaction.guild.roles.cache.find(x => x.name === roleName);
                await thread.send(`Hey ${roleMention(role.id)}, ${message}`);
            }
        }
        catch (err) {
            console.log(`Failed to notify inceptors about ${message}. Error: ${err.toString()}`);
        }
    }
}

module.exports = {
	InceptionError,
    VyklykManager,
};
