// /////////////////////////////////////////////////////////////////////////////////
//
// Define global constants, mostly messages that we show to the user in different
// locales as described here: https://discord.com/developers/docs/reference#locales
//
// /////////////////////////////////////////////////////////////////////////////////

// Create Vyklyk
const MDL_CREATE_VYKLYK_TITLE = { 'en-US': 'Create Vyklyk' };
const MDL_CREATE_VYKLYK_CHANNEL_LABEL = { 'en-US': 'Channel name' };
const MDL_CREATE_VYKLYK_CHANNEL_PLACEHOLDER = { 'en-US': 'Enter channel name without spaces' };
const MDL_CREATE_VYKLYK_TOPIC_LABEL = { 'en-US': 'Channel topic' };
const MDL_CREATE_VYKLYK_TOPIC_PLACEHOLDER = { 'en-US': 'Hint: use the title from discohook.org, and we will extend it with the link to the first message' };
const MDL_CREATE_VYKLYK_EMBED_LABEL = { 'en-US': 'Discohook JSON data' };
const MDL_CREATE_VYKLYK_EMBED_PLACEHOLDER = { 'en-US': 'Copy paste the text from http://discohook.org\'s JSON Data Editor' };
const MDL_CREATE_VYKLYK_INCEPTORS_LABEL = { 'en-US': 'Additional inceptors (must be server members)' };
const MDL_CREATE_VYKLYK_INCEPTORS_PLACEHOLDER = { 'en-US': 'Add more inceptors separated by space' };
const MDL_CREATE_VYKLYK_ACCEPT_BTN_LABEL = { 'en-US': 'Action button title' };
const MDL_CREATE_VYKLYK_ACCEPT_BTN_PLACEHOLDER = { 'en-US': 'Write your accept challenge button text' };

// Resigter to the Vyklyk

const MSG_REGISTER_ALREADY = {
    'en-US': 'You have been already registered for this challenge!',
    'id': 'Anda telah terdaftar untuk tantangan ini!',
    'ru': 'Вы уже успешно зарегестрировались на этот челлендж!',
};

const MDL_FACEIT_TITLE = {
    'en-US': 'Faceit Account',
    'ru': 'Учетная запись Faceit',
};

const MDL_FACEIT_LABEL = {
    'en-US': 'What\'s your Faceit nickname?',
    'ru': 'Какой у вас Faceit никнейм?',
};

const MDL_FACEIT_PLACEHOLDER = {
    'en-US': 'Enter your Faceit nickname',
    'ru': 'Введите Faceit никнейм, которым вы будете играть',
};

const CHALLENGE_SUBMISSION_SUCCESS = {
    'en-US': '{0}, thank you for submitting your Faceit nickname: {1}. We will review your sumbission soon and let you know if you are accepted!',
    'ru': '{0}, спасибо за то, что указали ваш Faceit никнейм: {1}. Ваш запрос на регистрацию добавлен. Мы его вскоре рассмотрим и уведомим вас о решении!',
};

// Example:
// const str = 'The {0} brown {1} jumps over the {2} dog.';
// const result = composeString(str, 'quick', 'fox', 'lazy');
// console.log(result);
// expected output: "The quick brown fox jumps over the lazy dog."

function composeString(str, ...args) {
    return str.replace(/{(\d+)}/g, (match, number) => {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match;
    });
}

function getMessageByLocale(messageId, locale) {
    if (!locale) return messageId['en-US'];
    return messageId[locale] ?? messageId['en-US'];
}

function getMessage(messageId, locale, ...args) {
    return composeString(getMessageByLocale(messageId, locale), ...args);
}

module.exports = {

    // Create Vyklyk
    MDL_CREATE_VYKLYK_TITLE: MDL_CREATE_VYKLYK_TITLE,
    MDL_CREATE_VYKLYK_CHANNEL_LABEL: MDL_CREATE_VYKLYK_CHANNEL_LABEL,
    MDL_CREATE_VYKLYK_CHANNEL_PLACEHOLDER: MDL_CREATE_VYKLYK_CHANNEL_PLACEHOLDER,
    MDL_CREATE_VYKLYK_TOPIC_LABEL: MDL_CREATE_VYKLYK_TOPIC_LABEL,
    MDL_CREATE_VYKLYK_TOPIC_PLACEHOLDER: MDL_CREATE_VYKLYK_TOPIC_PLACEHOLDER,
    MDL_CREATE_VYKLYK_EMBED_LABEL: MDL_CREATE_VYKLYK_EMBED_LABEL,
    MDL_CREATE_VYKLYK_EMBED_PLACEHOLDER: MDL_CREATE_VYKLYK_EMBED_PLACEHOLDER,
    MDL_CREATE_VYKLYK_INCEPTORS_LABEL: MDL_CREATE_VYKLYK_INCEPTORS_LABEL,
    MDL_CREATE_VYKLYK_INCEPTORS_PLACEHOLDER: MDL_CREATE_VYKLYK_INCEPTORS_PLACEHOLDER,
    MDL_CREATE_VYKLYK_ACCEPT_BTN_LABEL: MDL_CREATE_VYKLYK_ACCEPT_BTN_LABEL,
    MDL_CREATE_VYKLYK_ACCEPT_BTN_PLACEHOLDER: MDL_CREATE_VYKLYK_ACCEPT_BTN_PLACEHOLDER,

    // Resigter to the Challenge Messages
    MSG_REGISTER_ALREADY: MSG_REGISTER_ALREADY,
    MDL_FACEIT_TITLE: MDL_FACEIT_TITLE,
    MDL_FACEIT_LABEL: MDL_FACEIT_LABEL,
    MDL_FACEIT_PLACEHOLDER: MDL_FACEIT_PLACEHOLDER,
    CHALLENGE_SUBMISSION_SUCCESS: CHALLENGE_SUBMISSION_SUCCESS,

    // Functions
    getMessage: getMessage,
    composeString: composeString,
    // getMessage: function(messageId, locale, ...args) {
    //     if (!locale) return messageId['en-US'];
    //     return messageId[locale] ?? messageId['en-US'];
    // },
};