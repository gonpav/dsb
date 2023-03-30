const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
        // https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

        // WARNING: interaction token is valid for 15 minutes only

        // If you want your reply NOT being seen by all user and only
        // the one who had sent the initial interaction command - use ephemeral
        // await interaction.reply({ content: 'Secret Pong!', ephemeral: true });

		// If time to reply less than 3 seconds, then use reply('message');
        // await interaction.reply('Pong!');

        // If time to reply greater than 3 seconds, then use deferReply()
        await interaction.deferReply();
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
		await sleep(4000);
		await interaction.editReply('Visit [barre!](https://barrecurls.com)');

        // Localized replies:
        // const locales = {
        //     pl: 'Witaj Świecie!',
        //     de: 'Hallo Welt!',
        // };
        // await sleep(4000);
        // await interaction.editReply(locales[interaction.locale] ?? 'Hello World (default is english)');
	},
};