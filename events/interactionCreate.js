const { Events } = require('discord.js');
const BtnCommands = require('../btn-commands.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.user.bot) { return; }

		if (interaction.isChatInputCommand()) {
			// console.log(interaction);

			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		}
		else if (interaction.isAutocomplete()) {
			// console.log(interaction);

			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
			try {
				await command.autocomplete(interaction);
			}
			catch (error) {
				console.error(error);
			}
		}
		else if (interaction.isMessageContextMenuCommand()) {
			// console.log(interaction);

			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(error);
			}
		}
		else if (interaction.isButton()) {
			if (BtnCommands.isGlobalButton(interaction.customId)) {
				BtnCommands.onGlobalButtonInteraction(interaction);
			}
		}
	},
};