const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { openai_token } = require('../config.json');
const Parser = require('rss-parser');

const fs = require('node:fs');
const path = require('node:path');

async function getBBCNewsSummaries(rss_feed_url) {

	const parser = new Parser();

	// const configuration = new Configuration({
	//	apiKey: openai_token,
	// });
	// const openai = new OpenAIApi(configuration);

	const feed = await parser.parseURL(rss_feed_url);
    feed.items.forEach(item => {
        console.log(`Title: ${item.title}`);
        console.log(`Summary: ${item.contentSnippet}`);
        console.log(`Summary: ${item.guid}`);
        console.log(`Summary: ${item.link}`);
        console.log('---');
    });
	return null;
}

// Taken from Bing Chat: https://sl.bing.net/ieXm3Jh5uN2
// and updated to the most recent OpenAI API
async function getTheNewYorkNewsSummaries(rss_feed_url) {

	const parser = new Parser();

	const configuration = new Configuration({
		apiKey: openai_token,
	});
	const openai = new OpenAIApi(configuration);

	// Fetch the New York news RSS feed
	const feed = await parser.parseURL(rss_feed_url);

	// Extract article titles and descriptions
	const articlesTexts = feed.items.map(item => `${item.title}. ${item.contentSnippet}`);

	// Summarize each article using the OpenAI API
	// const summariesPromises = articlesTexts.map(async text => {
	// 	const result = await openai.createCompletion({
	// 		engine: 'code-davinci-002', // code-davinci-002
	// 		prompt: `Please summarize this article in one sentence: ${text}`,
	// 		temperature: 0.5,
	// 		max_tokens: 60,
	// 		top_p: 1.0,
	// 		frequency_penalty: 0.5,
	// 		presence_penalty: 0.0,
	// 		// stop: ["You:"],
	// 	});
	// 	return result.choices[0].text;
	// });

	try {
		const text = articlesTexts.at(0);
		const summariesPromises = await openai.createCompletion({
			model: 'code-davinci-002',
			prompt: `Please summarize this article in one sentence: ${text}`,
			temperature: 0.5,
			max_tokens: 60,
			// top_p: 1.0,
			// frequency_penalty: 0.5,
			// presence_penalty: 0.0,
			// stop: ['You:'],
		});

		// Wait for all summaries to be generated
		return Promise.all([summariesPromises]);
	}
	catch (error) {
		console.log(error);
	}
}

async function getNews(interaction) {
		const section = interaction.options.getString('section') ?? 'HomePage';

		function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

		// await interaction.deferReply();
		await interaction.reply('Wait...');
		await sleep(2000);
		await interaction.followUp(`Hold on! We are making a summary of the news for the section ${section}...`);

		// const NY_NEWS_RSS_FEED_URL = 'https://rss.nytimes.com/services/xml/rss/nyt/';
		// const section_url = NY_NEWS_RSS_FEED_URL + section + '.xml';

		// await getTheNewYorkNewsSummaries(section_url).then(summaries => {
		await getBBCNewsSummaries('http://feeds.bbci.co.uk/news/rss.xml').then(summaries => {
			if (summaries && summaries.length > 0) {
				console.log(summaries);
				/* await */ interaction.followUp(summaries[0].data.choices[0].text);
			}
		});

		// await sleep(4000);
		// await interaction.followUp(`Here is the result: ${section_url}!`);
		// await interaction.followUp('Pong again!');
}

async function postEmbedAndButton(interaction) {
	const channelId = interaction.options.getString('section') ?? '1083187401582723093';
	// const channel = await interaction.client.channels.fetch(`${channelId}`);//
	const channel = await interaction.client.channels.cache.get(channelId);

	// If the channel is not found, return
	if (!channel) {
		return await interaction.reply({ content: `Channel with id=${channelId} cannot be found`, ephemeral: true });
	}

	const button_name = 'Принять участие!';
	const button_register_id = `btn_register_${channelId}`;

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId(button_register_id)
				.setLabel(button_name)
				.setStyle(ButtonStyle.Primary),
			);

	const description = 'А какие же условия участия? Всё очень просто:\n\n' +
		`1. Зайти на канал челенджа <#${channelId}>\n\n` +
		`2. Зарегестрироваться нажав на кнопку \`${button_name}\` внизу\n\n` +
		'3. Выиграть как можно больше игр за выходные.  :gun:\n\n' +
		'Всё супер просто!\n\n' +
		'Ну что, удачи тогда всем, всех обняв 🤍 :rocket: ';
	const embed = new EmbedBuilder()
		.setColor(0x753d3d)
		.setTitle('Регистрация!')
		.setAuthor({ name: 'Malkisya', iconURL: 'https://cdn.discordapp.com/attachments/1083584210473861232/1085112263733690418/malkisya.jpeg' })
		.setDescription(description);

	await channel.send({
		// content: 'I think you should,',
		components: [row],
		embeds: [embed],
		// username: 'Malkisya',
		// avatar_url: 'https://cdn.discordapp.com/attachments/1083584210473861232/1085112263733690418/malkisya.jpeg',
	});

	await interaction.followUp({ content: `REGISTER button with id=${button_register_id} has been added to the channel ${channel.name}`, ephemeral: true });
}

async function postWebhook(interaction) {
	const channelId = interaction.options.getString('section') ?? '1085124053792215040'; // '1083187401582723093'
	// const channel = await interaction.client.channels.fetch(`${channelId}`);//
	const channel = await interaction.client.channels.cache.get(channelId);

	// If the channel is not found, return
	if (!channel) {
		return await interaction.reply({ content: `Channel with id=${channelId} cannot be found`, ephemeral: true });
	}

	function getVyklykData() {
		const vyklyksPath = path.join(__dirname, '..//vyklyks');
		const vyklykFiles = fs.readdirSync(vyklyksPath).filter(file => file.endsWith('.json'));

		// JSON.parse(fs.readFileSync('../vyklyks/winall-vyklyk.json'));
		for (const file of vyklykFiles) {
			const filePath = path.join(vyklyksPath, file);
			const vyklykData = require(filePath);
			// console.log(vyklykData);
			return vyklykData;
		}
	}
	const vyklykData = getVyklykData ();

	// Find a web-hook with channel-name-id. If not found then create one
	const webHookName = `Vyklyk Hook ${channelId}`;
	const webHooks = await channel.fetchWebhooks();
	let webhookClient = webHooks ? webHooks.find(wh => wh.name === webHookName) : null;
	if (!webhookClient) {
		webhookClient = await channel.createWebhook({
			name: webHookName,
			avatar: vyklykData.avatar_url,
		});
	}
	await interaction.followUp({ content: `Webhook id=${webhookClient.id} has been found or created for the channel ${channel.name}`, ephemeral: true });

	const button_name = 'Принять участие!';
	const button_register_id = `btn_register_${channelId}`;

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId(button_register_id)
				.setLabel(button_name)
				.setStyle(ButtonStyle.Primary),
			);

	vyklykData.components = [row];
	await webhookClient.send(vyklykData);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('news')
		.setDescription('What`s interesting in the world from The New York Times!')
		// .addStringOption(option =>
		// 	option.setName('query')
		// 		.setDescription('Phrase to search for')
		// 		.setAutocomplete(true)
        //         .setRequired(true))
		.addStringOption(option =>
			option.setName('section')
				.setDescription('News on specific topic. More sections here: https://developer.nytimes.com/docs/rss-api/1/overview')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'section') {
			choices = ['HomePage', 'Arts', 'Business', 'Health', 'Science', 'Sports', 'Style', 'Technology', 'Travel', 'US', 'World'];
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			return await interaction.reply({ content: 'You do not have permissions to execute this command. Please contact the administrator', ephemeral: true });
		}
		await interaction.deferReply({ ephemeral: true });

		postWebhook(interaction);
		// postEmbedAndButton(interaction);


		// OLD STUFF below:
		// await getNews(interaction);
	},
};