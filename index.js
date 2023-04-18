require('dotenv').config();

let keep_alive;
if (process.env.KEEP_ALIVE === 'true') {
    // Require keep_alive.js to continue working in Replit env:
    // https://docs.replit.com/tutorials/nodejs/build-basic-discord-bot-nodejs#keeping-our-bot-alive
    keep_alive = require('./keep_alive.js');
}

// console.log(process.env.REPLIT_DB_URL);

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Create a new client instance
// const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Required to show Welcome to new memebers
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions] });

const readClientCommands = function() {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
    else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
};
readClientCommands();

const readClientEvents = function() {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    }
    else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
};
readClientEvents();

// Get token from .env
const token = process.env.TOKEN;
client.login(token);