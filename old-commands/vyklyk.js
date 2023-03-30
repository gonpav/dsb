const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Vyklyk')
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        const { commandName, targetMessage } = interaction;
        if (commandName === 'Vyklyk') {
            console.log(commandName);
            console.log(targetMessage);
           // const message = await interaction.reply(`This message is ${targetMessage}`);
            const message = await interaction.reply({ content: `This message is ${targetMessage}`, fetchReply: true });
            message.react('😄');
        }
    },
};