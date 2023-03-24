// /////////////////////////////////////////////////////////////////////////////////
//
// Define global button customIds here in this file.
// As well as event handlers for the global button ids
//
// /////////////////////////////////////////////////////////////////////////////////

const { ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { channelMention, userMention, inlineCode } = require('discord.js');
const MsgConstants = require('./msg-constants.js');

// Check if user already registered for the Challenge
function isUserRegistered(userId) {
    if (userId === '1083198956680527992') return false;
    return true;
}

module.exports = {

    // Constants
    BTN_VYKLYK_REGISTER_PREFIX: 'btn_global_register_',


    // Functions
    isGlobalButton: function(buttonId) {
        return buttonId.startsWith(this.BTN_VYKLYK_REGISTER_PREFIX);
    },
    onGlobalButtonInteraction: async function(interaction) {
        if (interaction.customId.startsWith(this.BTN_VYKLYK_REGISTER_PREFIX)) this.onRegisterVyklykInterection(interaction);
    },
    createVyklykRegisterButtonId: function(channelId) {
        return `${this.BTN_VYKLYK_REGISTER_PREFIX}${channelId}`;
    },
    onRegisterVyklykInterection: async function(interaction) {
        // console.log(interaction);

        // We do NOT use defer here because of showModal later that should shown first
        // await interaction.deferReply({ ephemeral: true });

        if (false /* isUserRegistered(interaction.user.id) */) {
            // return await interaction.followUp({ - we do NOT use followUp here because of NO deferReply above
            return await interaction.reply ({
                content: MsgConstants.getMessage(MsgConstants.MSG_REGISTER_ALREADY, interaction.locale),
                ephemeral: true,
                });
        }

        // 1. TODO: Check if user can apply

        if (false) {
            // Here is the code of creation of the special thread for the user registration.
            // I removed it because it looks more complex flow than it should be

            const privateThreadName = `registration-${interaction.user.tag}`;
            let thread = interaction.channel.threads.cache.find(x => x.name === privateThreadName);
            if (!thread) {
                thread = await interaction.channel.threads.create({
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

        // Show message box to enter the Faceit Id
        const MODAL_FACEIT_TITLE = MsgConstants.getMessage(MsgConstants.MDL_FACEIT_TITLE, interaction.locale);
        const MODAL_FACEIT_REGISTER_ID = `mdl_register_${interaction.channel.id}_faceit_${interaction.user.id}`;
		const modal = new ModalBuilder()
			.setCustomId(MODAL_FACEIT_REGISTER_ID)
			.setTitle(MODAL_FACEIT_TITLE);

		// Add components to modal

		// Create the text input components
        const MODAL_FACEIT_INPUT_ID = `inp_register_${interaction.channel.id}_faceit_${interaction.user.id}`;
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
                const faceitNickname = i.fields.getTextInputValue(MODAL_FACEIT_INPUT_ID);
                const message = MsgConstants.getMessage(
                    MsgConstants.CHALLENGE_SUBMISSION_SUCCESS, 
                    interaction.locale,
                    userMention(i.user.id),
                    inlineCode(faceitNickname));
                // await interaction.followUp({ content: message, ephemeral: true });

                // Long operation here....
                console.log(message);
                // console.log(`Collected ${faceitNickname} from ${i.user.tag}`);

                // await i.reply({ content: message, ephemeral: true }); // Use this if NO i.deferUpdate(); in filter
                await i.followUp({ content: message, ephemeral: true }); // Use this if i.deferUpdate(); in filter
                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }

                await sleep(2000);
                await i.followUp({ content: 'Hold on! We are continue processing your request', ephemeral: true });

            })
            .catch(err => {
                console.log(`No modal submit interaction was collected: ${err.toString()}`);
            });
    //     const collector = interaction.channel.createMessageComponentCollector({ filter });
    //     collector.on('collect', async i => {
    //         console.log(`Collected ${i}`);
    //         // await i.update({ content: 'A button was clicked!', components: [] });
    //     });
    //     collector.on('end', collected => {
    //         console.log(`Collected ${collected.size} items`);
    //     });
    },
};