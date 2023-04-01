// /////////////////////////////////////////////////////////////////////////////////
//
// Define global button customIds here in this file.
// As well as event handlers for the global button ids
//
// /////////////////////////////////////////////////////////////////////////////////

const { ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { channelMention, userMention, inlineCode } = require('discord.js');

const { VyklykManager } = require('./vyklyk-manager.js');
const MsgConstants = require('./msg-constants.js');

// Constants
const BTN_VYKLYK_REGISTER_PREFIX = 'btn_global_register_';
const MODAL_FACEIT_REGISTER_PREFIX = 'mdl_register_{0}_faceit_{1}';
const MODAL_FACEIT_INPUT_PREFIX = 'inp_register_{0}_faceit_{1}';

module.exports = {

    // Functions
    isGlobalButton: function(buttonId) {
        return buttonId.startsWith(BTN_VYKLYK_REGISTER_PREFIX);
    },
    onGlobalButtonInteraction: async function(interaction) {
        if (interaction.customId.startsWith(BTN_VYKLYK_REGISTER_PREFIX)) this.onRegisterVyklykInterection(interaction);
    },
    createVyklykRegisterButtonId: function(channelId) {
        return `${BTN_VYKLYK_REGISTER_PREFIX}${channelId}`;
    },
    onRegisterVyklykInterection: async function(interaction) {
        // console.log(interaction);

        // We do NOT use defer here because of showModal later that should shown first
        // await interaction.deferReply({ ephemeral: true });

        const channelId = getVyklykRegisterButtonChannelId(interaction);

        // Check if user can apply
        if (!await validateApplication(interaction, channelId)) return;

        const channel = await VyklykManager.getChannelById(interaction, channelId);

        // Here is the code of creation of the special thread for the user registration.
        // I removed it because it looks more complex flow than it should be
        // createPrivateRegistrationThread (interaction, channel);

        // Show message box to enter the Faceit Id
        const MODAL_FACEIT_TITLE = MsgConstants.getMessage(MsgConstants.MDL_FACEIT_TITLE, interaction.locale);
        const MODAL_FACEIT_REGISTER_ID = MsgConstants.composeString(MODAL_FACEIT_REGISTER_PREFIX, interaction.channel.id, interaction.user.id);

		const modal = new ModalBuilder()
			.setCustomId(MODAL_FACEIT_REGISTER_ID)
			.setTitle(MODAL_FACEIT_TITLE);

		// Add components to modal

		// Create the text input components
        const MODAL_FACEIT_INPUT_ID = MsgConstants.composeString(MODAL_FACEIT_INPUT_PREFIX, interaction.channel.id, interaction.user.id);
		const faceitNicknameInput = new TextInputBuilder()
			.setCustomId(MODAL_FACEIT_INPUT_ID)
			.setLabel(MsgConstants.getMessage(MsgConstants.MDL_FACEIT_LABEL, interaction.locale))
            .setPlaceholder(MsgConstants.getMessage(MsgConstants.MDL_FACEIT_PLACEHOLDER, interaction.locale))
			.setStyle(TextInputStyle.Paragraph); // Short means only a single line of text

        // An action row only holds one text input,
		// so you need one action row per text input.
		const firstActionRow = new ActionRowBuilder().addComponents(faceitNicknameInput);

		// Add inputs to the modal
		modal.addComponents(firstActionRow);

		// Show the modal to the user
        await interaction.showModal(modal);

        // As for Defer Update, then  see this post by Bing chat:
        // https://sl.bing.net/d3a9JTncd4e
        const filter = async i => {
            await i.deferUpdate();
            return i.customId === MODAL_FACEIT_REGISTER_ID && i.user.id === interaction.user.id;
        };
        // const filterSync = i => {
        //     i.deferUpdate();
        //     return i.customId === MODAL_FACEIT_REGISTER && i.user.id === interaction.user.id;
        // };
        interaction.awaitModalSubmit({ time: 600_000, filter })
            .then(async (i) => {

                try {
                    VyklykManager.addMemberToPendingChallengers(i, i.member, channelId);

                    const faceitNickname = i.fields.getTextInputValue(MODAL_FACEIT_INPUT_ID);
                    let message = MsgConstants.getMessage(
                        MsgConstants.MSG_REGISTRATION_SUCCESS,
                        interaction.locale,
                        userMention(i.user.id),
                        inlineCode(faceitNickname));

                    // await i.reply({ content: message, ephemeral: true }); // Use this if NO i.deferUpdate(); in filter
                    await i.followUp({ content: message, ephemeral: true }); // Use this if i.deferUpdate(); in filter

                    message = `new challenge application submitted!!! \nDiscord user ${inlineCode(i.member.displayName)} / (${inlineCode(i.member.user.tag)}) with 'challenger-id': ${inlineCode(i.member.user.id)} specified Faceit nickname: ${inlineCode(faceitNickname)}.\nPlease review the application and approve or reject it ASAP.`;
                    VyklykManager.tryNotifyInceptors(i, channel, message);
                }
                catch (err) {
                    // await i.reply({ content: message, ephemeral: true }); // Use this if NO i.deferUpdate(); in filter
                    await i.followUp({ content: MsgConstants.getMessage(MsgConstants.MSG_REGISTRATION_ERROR, interaction.locale), ephemeral: true }); // Use this if i.deferUpdate(); in filter
                }
            })
            .catch(err => {
                console.log(`No modal submit interaction was collected: ${err.toString()}`);
            });
    },
};

function getVyklykRegisterButtonChannelId(interaction) {
    if (interaction.customId.startsWith(BTN_VYKLYK_REGISTER_PREFIX)) {
        return interaction.customId.substring(BTN_VYKLYK_REGISTER_PREFIX.length);
    }
}

async function validateApplication(interaction, channelId) {

    if (VyklykManager.isMemberChallenger(interaction.member, channelId)) {
        await interaction.reply ({
            content: MsgConstants.getMessage(MsgConstants.MSG_REGISTER_ALREADY, interaction.locale),
            ephemeral: true,
            });
        return false;
    }
    if (VyklykManager.isMemberPendingChallenger(interaction.member, channelId)) {
        await interaction.reply ({
            content: MsgConstants.getMessage(MsgConstants.MSG_REGISTER_PENDING, interaction.locale),
            ephemeral: true,
            });
        return false;
    }
    if (VyklykManager.isMemberBanned(interaction.member, channelId)) {
        await interaction.reply ({
            content: MsgConstants.getMessage(MsgConstants.MSG_YOU_WERE_BANNED, interaction.locale),
            ephemeral: true,
            });
        return false;
    }
    return true;
}

async function createPrivateRegistrationThread(interaction, channel) {

    const privateThreadName = `registration-${interaction.user.tag}`;
    let thread = channel.threads.cache.find(x => x.name === privateThreadName);
    if (!thread) {
        thread = await channel.threads.create({
            name: privateThreadName,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: 'Needed a separate thread for registration process',
        });

        await thread.members.add(interaction.user.id);
    }
    // await interaction.followUp({
    await interaction.reply({
        content: `Continue registration in ${channelMention(thread.id)}`,
        ephemeral: true,
    });
    await thread.send(`Hey ${userMention(interaction.user.id)}! Continue registration here!`);
}