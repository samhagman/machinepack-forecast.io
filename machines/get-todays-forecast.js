module.exports = {
    friendlyName: 'Get today\'s weather',
    description: 'Get the forecast for the current day.',
    extendedDescription: '',
    inputs: {
        lat: {
            example: '42.3507282',
            description: 'The latitude of the location you are trying to forecast.',
            required: true
        },
        lng: {
            example: '-71.13212709999999',
            description: 'The longitude of the location you are trying to forecast.',
            required: true
        },
        apiKey: {
            example: 'ab1d526c3c074c2a48c25476c19a9d0a',
            description: 'This is your Forecast.io API Key.',
            required: true
        },
        returnCard: {
            example: true,
            description: 'This is whether or not to return an HTML card representing the returned current weather',
            required: false
        }
    },
    defaultExit: 'success',
    exits: {
        error: {
            description: 'Unexpected error occurred.'
        },
        invalidLatOrLong: {
            description: 'You have passed in an invalid latitude or longitude.'
        },
        noLatOrLong: {
            description: 'You did not provide both a latitude and a longitude.'
        },
        noAPIKey: {
            description: 'You did not pass in a Forecast.io API key.'
        },
        invalidAPIKey: {
            description: 'Your Forecast.io API key is not valid.'
        },
        success: {
            description: 'Returns a weather forecast.',
            example: '{}'
        }
    },
    fn: function(inputs, exits) {

        /* Dependencies */
        require('babel/register');
        let swig = require('swig');
        let request = require('request');
        let Promise = require('bluebird');

        function getWeather(lat, lng) {

            try {
                return new Promise(function(resolve) {

                    request(`https://api.forecast.io/forecast/${inputs.apiKey}/${lat},${lng}`, function(e, response, body) {
                        if (!e && response.statusCode === 200) {
                            resolve(JSON.parse(body));
                        }
                        else {
                            return exits.error(`An error was returned from the forecast.io API: ${e}`);
                        }
                    });
                });
            }
            catch (e) {
                return exits.error(`An error occurred while attempting to make a request to forecast.io: ${e.message}`);
            }
        }


        getWeather(inputs.lat, inputs.lng)
            .then(function(weather) {
                try {
                    return exits.success([ {
                        view: swig.renderFile('../weather-card.html', {
                            cards: [ {
                                icon: weather.hourly.icon,
                                temperature: weather.currently.temperature,
                                summary: weather.hourly.summary
                            } ]
                        }),
                        text: weather.hourly.summary,
                        weather: weather
                    } ]);
                }
                catch (e) {
                    return exits.error(`An error occurred while building your response: ${e.message}`);
                }
            })
            .catch(function(e) {
                return exits.error(`An error occurred while getting the weather from forecast.io: ${e.message}`);
            })
        ;
    }
};