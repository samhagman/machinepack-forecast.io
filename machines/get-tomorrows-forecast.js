module.exports = {
    friendlyName:        'Get today\'s weather',
    description:         'Get the forecast for the current day.',
    extendedDescription: '',
    inputs:              {
        lat:        {
            example:     '42.3507282',
            description: 'The latitude of the location you are trying to forecast.',
            required:    true
        },
        lng:        {
            example:     '-71.13212709999999',
            description: 'The longitude of the location you are trying to forecast.',
            required:    true
        },
        apiKey:     {
            example:     'ab1d526c3c074c2a48c25476c19a9d0a',
            description: 'This is your Forecast.io API Key.',
            required:    true
        }
    },
    defaultExit:         'success',
    exits:               {
        error:            {
            description: 'Unexpected error occurred.'
        },
        invalidLatOrLong: {
            description: 'You have passed in an invalid latitude or longitude.'
        },
        noLatOrLong:      {
            description: 'You did not provide both a latitude and a longitude.'
        },
        noAPIKey:         {
            description: 'You did not pass in a Forecast.io API key.'
        },
        invalidAPIKey:    {
            description: 'Your Forecast.io API key is not valid.'
        },
        success:          {
            description: 'Returns a weather forecast.',
            example:     '{}'
        }
    },
    fn:                  function(inputs, exits) {

        /* Dependencies */
        require('babel/register');
        const swig = require('swig');
        const request = require('request');
        const Promise = require('bluebird');
        const moment = require('moment');

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
                    var day = parseInt(moment().day());
                    if (moment().hour() > 5) {
                        day += 1;
                    }
                    var w = weather.daily.data[ day ];
                    var t = 'Tomorrow, low of ' + w.temperatureMin + ' and high of ' + w.temperatureMax + '. ';
                    return [ {
                        view:    swig.renderFile(__dirname + '/weather.html', {
                            cards: [ {
                                icon:    w.icon,
                                low:     w.temperatureMin,
                                high:    w.temperatureMax,
                                summary: w.summary
                            } ]
                        }),
                        text:    t + w.summary,
                        weather: weather
                    } ];
                }
                catch (e) {
                    return exits.error(`There was an error attempting to build the response. ${e.message}`);
                }
            })
            .catch(function(e) {
                return exits.error(`An error occurred while getting the weather from forecast.io: ${e.message}`);
            })
        ;
    }
};