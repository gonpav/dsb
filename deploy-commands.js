/* eslint-disable no-multi-spaces */
/* eslint-disable no-inline-comments */

// https://discordjs.guide/creating-your-bot/command-deployment.html#command-registration

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;
const guildId = process.env.GUILDID;

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands
		const data = await rest.put(
			// Routes.applicationCommands(clientId),           // in Global scope
            Routes.applicationGuildCommands(clientId, guildId),     // in scope of the Guild
			{ body: commands },
		);
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
    catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();