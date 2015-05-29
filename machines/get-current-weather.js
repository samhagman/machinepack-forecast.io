module.exports = {
    friendlyName:        'Get current weather',
    description:         'Get the current weather at a location.',
    extendedDescription: '',
    inputs:              {
        lat:  {
            example:     'tuneyards',
            description: 'The latitude of the location you are trying to forecast.',
            required:    true
        },
        lng: {
            example:     '20.4030.20',
            description: 'The longitude of the location you are trying to forecast.',
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
        success:          {
            description: 'Returns a weather forecast.',
            example:     '{}'
        }
    },
    fn:                  function(inputs, exits) {

        /* Dependencies */
        require('babel/register');
        let swig = require('swig');
        let request = require('request');
        let Promise = require('bluebird');

        function getWeather(lat, lng) {

            try {
                return new Promise(function(resolve, reject) {

                    request('https://api.forecast.io/forecast/ab8d5e6cec075c2ad8c2c474c10e9d0a/' + lat + ',' + lng, function(error, response, body) {
                        if (!error && response.statusCode === 200) {
                            resolve(JSON.parse(body));
                        } else {
                            return exits.error(error);
                        }
                    });
                });
            } catch (e) {
                return exits.error(e);
            }
        }


        getWeather(inputs.lat, inputs.lng)
            .then(function(weather) {
                return exits.success([ {
                    view: swig.renderFile(__dirname + '/weather.html', {
                        cards: [ {
                            icon:        weather.currently.icon,
                            temperature: weather.currently.temperature,
                            summary:     weather.currently.summary
                        } ]
                    }),
                    text: weather.currently.summary
                } ]);
            })
            .catch(function(err) {
                return exits.error('An error occurred while getting the weather from forecast.io. ' + err.message);
            })
        ;
    }
};