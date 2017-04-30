'use strict';
require('dotenv').config();
const Alexa = require('alexa-sdk');
const info = require('./info');
const info_detailed = require('./info_detailed');

const APP_ID = process.env.ALEXA_APP_ID;
var VoiceLabs = require("voicelabs")(process.env.VOICE_LABS_API_KEY);

const handlers = {
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMT');
        VoiceLabs.track(this.event.session, this.event.request.intent.name, this.event.request.intent.slots, this.attributes.speechOutput, (error, response) => {
			this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
		});
    },
    'RecycleIntent': function () {
        const itemSlot = this.event.request.intent.slots.item;
        let itemName;
        if (itemSlot && itemSlot.value) {
            itemName = itemSlot.value.toLowerCase();
        }

        const cardTitle = this.t('DISPLAY_CARD_TITLE', this.t('SKILL_NAME'), itemName);
        const recyclingFacts = this.t('INFO_DETAILED');

        if (factExists(recyclingFacts, itemName)) {
			const fact = getRandomFact(recyclingFacts, itemName);
            this.attributes.speechOutput = fact;
            this.attributes.repromptSpeech = this.t('REPEAT_MESSAGE');
			VoiceLabs.track(this.event.session, this.event.request.intent.name, this.event.request.intent.slots, fact, (error, response) => {
				this.emit(':askWithCard', fact, this.attributes.repromptSpeech, cardTitle, fact);
			});
        } else {
            let speechOutput = this.t('NOT_FOUND_MESSAGE');
            const repromptSpeech = this.t('NOT_FOUND_REPROMPT');
            if (itemName) {
                speechOutput += this.t('NOT_FOUND_WITH_ITEM_NAME', itemName);
            } else {
                speechOutput += this.t('NOT_FOUND_WITHOUT_ITEM_NAME');
            }
            speechOutput += repromptSpeech;

            this.attributes.speechOutput = speechOutput;
            this.attributes.repromptSpeech = repromptSpeech;
			
			VoiceLabs.track(this.event.session, this.event.request.intent.name, this.event.request.intent.slots, speechOutput, (error, response) => {
				this.emit(':ask', speechOutput, this.attributes.repromptSpeech);
			});
        }
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMT');
		VoiceLabs.track(this.event.session, intent.name, intent.slots, this.attributes.speechOutput, (error, response) => {
			this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
		});
    },
    'AMAZON.RepeatIntent': function () {
		VoiceLabs.track(this.event.session, intent.name, intent.slots, this.attributes.speechOutput, (error, response) => {
			this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
		});
    },
    'AMAZON.StopIntent': function () {
		VoiceLabs.track(this.event.session, intent.name, intent.slots, null, (error, response) => {
			this.emit('SessionEndedRequest');
		});
    },
    'AMAZON.CancelIntent': function () {
		VoiceLabs.track(this.event.session, intent.name, intent.slots, null, (error, response) => {
			this.emit('SessionEndedRequest');
		});
    },
    'SessionEndedRequest': function () {
		VoiceLabs.track(this.event.session, intent.name, intent.slots, this.t('STOP_MESSAGE'), (error, response) => {
			this.emit(':tell', this.t('STOP_MESSAGE'));
		});
    },
};

const languageStrings = {
    'en-US': {
        translation: {
            INFO: info.FACTS_EN_US,
			INFO_DETAILED: expand(info_detailed.FACTS_EN_US),
            SKILL_NAME: 'Captain Planet',
            WELCOME_MESSAGE: "I AM %s. You can ask a question like, can I recycle a soda can? ... Now, what can I help you with.",
            WELCOME_REPROMT: 'For instructions on what you can say, please say help me.',
            DISPLAY_CARD_TITLE: '%s  - Recycling %s.',
            HELP_MESSAGE: "You can ask questions such as, can I recycle, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMT: "You can say things like, can I recycle cardboard, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!',
            REPEAT_MESSAGE: 'Try saying repeat.',
            NOT_FOUND_MESSAGE: "I\'m sorry, I currently do not know ",
            NOT_FOUND_WITH_ITEM_NAME: 'the info for %s. ',
            NOT_FOUND_WITHOUT_ITEM_NAME: 'that info. ',
            NOT_FOUND_REPROMPT: 'What else can I help with?',
        },
    },
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
	alexa.APP_ID = APP_ID;
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function expand(obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i],
            subkeys = key.split(/,\s?/),
            target = obj[key];
        delete obj[key];
        subkeys.forEach(function(key) { obj[key] = target; })
    }
    return obj;
}

function factExists(dict, itemName) {
	return dict[itemName].facts.length > 0;
}

function getRandomFact(dict, itemName) {
	var facts = dict[itemName].facts;
	var randomNum = Math.floor(Math.random() * (facts.length));
	return facts[randomNum].fact;
}
