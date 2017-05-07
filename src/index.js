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
			this.attributes.itemName = itemName;
        }

        const cardTitle = this.t('DISPLAY_CARD_TITLE', this.t('SKILL_NAME'), itemName);
        const recyclingFacts = this.t('INFO_DETAILED');

        if (factExists(recyclingFacts, itemName)) {
			this.attributes.currentState = 'FACT';
			const fact = getRandomFact(recyclingFacts, itemName);
			const feedback = nextSuggestion(this, this.attributes.currentState, recyclingFacts, itemName);
            this.attributes.speechOutput = fact + '... '+ feedback;
            this.attributes.repromptSpeech = this.t('REPEAT_MESSAGE');
			VoiceLabs.track(this.event.session, this.event.request.intent.name, this.event.request.intent.slots, this.attributes.speechOutput, (error, response) => {
				this.emit(':askWithCard', this.attributes.speechOutput, this.attributes.repromptSpeech, cardTitle, fact);
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
	'YesIntent': function () {
		const currentState = this.attributes.suggestedState;
		const itemName = this.attributes.itemName;
		const eventPrompt = getInfoForState(currentState, this.t('INFO_DETAILED'), itemName);
		const feedback = nextSuggestion(this, currentState, this.t('INFO_DETAILED'), itemName);

		const cardTitle = this.t('DISPLAY_CARD_TITLE', this.t('SKILL_NAME'), itemName);

		this.attributes.speechOutput = eventPrompt + '... '+ feedback;
		this.attributes.repromptSpeech = feedback;
		VoiceLabs.track(this.event.session, currentState, this.event.request.intent.slots, this.t('STOP_MESSAGE'), (error, response) => {
			this.emit(':askWithCard', this.attributes.speechOutput, this.attributes.repromptSpeech, cardTitle, eventPrompt);
		});
	},
	'NoIntent':function () {
		VoiceLabs.track(this.event.session, intent.name, intent.slots, this.t('STOP_MESSAGE'), (error, response) => {
			this.emit(':tell', this.t('STOP_MESSAGE'));
		});
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
			SUGGEST_TIP_WITH_ITEM: "Would you like me to suggest some tips for recycling %s?",
			SUGGEST_ACTION_WITH_ITEM: "Would you like me to suggest some ways to recycle %s?",
			DEFAULT_REPROMPT: 'What else can I help with?',
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
	return dict[itemName] && dict[itemName].facts.length > 0;
}

function getRandomFact(dict, itemName) {
	var facts = dict[itemName].facts;
	var randomNum = Math.floor(Math.random() * (facts.length));
	return facts[randomNum].fact;
}	

function tipExists(dict, itemName) {
	return dict[itemName] && dict[itemName].tips.length > 0;
}

function getRandomTip(dict, itemName) {
	var tips = dict[itemName].tips;
	var randomNum = Math.floor(Math.random() * (tips.length));
	return tips[randomNum].tip;
}	

function actionExists(dict, itemName) {
	return dict[itemName] && dict[itemName].actions.length > 0;
}

function getRandomAction(dict, itemName) {
	var actions = dict[itemName].actions;
	var randomNum = Math.floor(Math.random() * (actions.length));
	return actions[randomNum].action;
}

function getInfoForState(event, dict, itemName) {
	switch(event) {
		case 'FACT':
			if(factExists(dict, itemName)) {
				return getRandomFact(dict, itemName);
			}
			break;
		case 'TIP':
			if(tipExists(dict, itemName)) {
				return getRandomTip(dict, itemName);
			}
			break;
		case 'ACTION':
			if(actionExists(dict, itemName)) {
				return getRandomAction(dict, itemName);
			}
			break;
	}
}

function nextSuggestion(context, currentState, dict, itemName)  {
	if(currentState === 'FACT') {
		if(tipExists(dict, itemName)) {
			context.attributes.suggestedState = 'TIP';
			return context.t('SUGGEST_TIP_WITH_ITEM',itemName);
		} else if(actionExists(dict, itemName)) {
			context.attributes.suggestedState = 'ACTION';
			return context.t('SUGGEST_ACTION_WITH_ITEM',itemName);
		}
	} else if(currentState === 'TIP') {
		if(actionExists(dict, itemName)) {
			context.attributes.suggestedState = 'ACTION';
			return context.t('SUGGEST_ACTION_WITH_ITEM',itemName);
		} 
	}
	return context.t('DEFAULT_REPROMPT');
}
