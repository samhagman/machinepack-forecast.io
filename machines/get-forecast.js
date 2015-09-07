/* Dependencies */
const request = require('request');
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');

module.exports = {
    friendlyName: 'Get current forecast',
    description: 'Retrieves the forecast of a specific latitude and longitude at a specific time',
    extendedDescription: '',
    moreInfoUrl: 'https://developer.forecast.io/docs/v2',
    cacheable: true,
    sync: false,
    idempotent: false,
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
        time: {
            example: '2013-05-06T12:00:00-0400',
            description: 'Any valid Moment.js time (http://momentjs.com)',
            required: true
        },
        timeFormat: {
            example: 'YYYY-MM-DD',
            description: 'Any valid Moment.js time format (http://momentjs.com)',
            required: true
        },
        options: {
            example: {
                'callback': 'logResult',
                'units': 'si',
                'exclude': [ 'currently', 'minutely', 'hourly', 'daily', 'alerts', 'flags' ],
                'extend': 'hourly',
                'lang': 'es'
            },
            description: 'An object with keys representing the query parameters accepted by the forecast.io API. (https://developer.forecast.io/docs/v2#options)',
            required: false
        },
        apiKey: {
            example: 'ab1d526c3c074c2a48c25476c19a9d0a',
            description: 'This is your Forecast.io API Key.',
            required: true
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
        invalidAPIKey: {
            description: 'Your Forecast.io API key is not valid.'
        },
        invalidOptions: {
            description: 'You passed an invalid options object'
        },
        success: {
            description: 'Returns a weather forecast.',
            example: '{}'
        }
    },
    fn: function(inputs, exits) {

        /**
         * Make a GET request to the forecast.io API and return the result
         * @param lat
         * @param lng
         * @param time
         * @param {string} queryString
         * @returns {Object}
         */
        function getForecast(lat, lng, time, queryString) {

            try {
                return new Promise((resolve) => {

                    const apiEndpoint = `https://api.forecast.io/forecast/${inputs.apiKey}/${lat},${lng},${time}${queryString}`;

                    request(apiEndpoint, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            try {
                                // If response wrapped in callback, do not JSON.parse response, it isn't valid JSON
                                if (inputs.options && inputs.options.callback) {
                                    resolve(body);
                                }
                                else {
                                    resolve(JSON.parse(body));
                                }
                            } catch (e) {
                                return exits.error(`There was an error parsing forecast.io's response: ${e}`);
                            }
                        }
                        else {
                            if (response.statusCode === 403) {
                                return exits.invalidAPIKey();
                            }
                            else if (response.statusCode === 400) {
                                return exits.error('There was an error formatting a valid API request, please open an issue at github.com/samhagman/machinepack-forecast.io with the options you tried to pass.');
                            }
                            else {
                                return exits.error(`An error was returned from the forecast.io API with HTTP status code: ${response.statusCode}`);
                            }
                        }
                    })
                    ;
                });
            }
            catch (e) {
                return exits.error(`An error occurred while attempting to make a request to forecast.io: ${e.message}`);
            }
        }

        /**
         * Validates the inputs
         * @returns {boolean}
         */
        function validateInputs() {

            /**
             * Regular expression to match valid latitude and longitude points.
             * @type {RegExp}
             */
            const latLongRegEx = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
            const validUnits = [ 'us', 'si', 'ca', 'uk', 'auto' ];
            const validExcludes = [ 'currently', 'minutely', 'hourly', 'daily', 'alerts', 'flags' ];
            const validLanguages = [ 'ar', 'bs', 'de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'ru', 'sv', 'tet', 'tr', 'x-pig-latin', 'zh' ];

            // If no API key
            if (!inputs.apiKey) {
                return exits.invalidAPIKey(`: ${inputs.apiKey}`);
            }
            // If latitude or longitude is invalid
            else if (!`${inputs.lat}, ${inputs.lng}`.match(latLongRegEx)) {
                return exits.invalidLatOrLong();
            }
            else if (inputs.options) {

                if (inputs.options.units !== '' && !_.includes(validUnits, inputs.options.units)) {
                    return exits.invalidOptions(`Your units option (${inputs.options.units}) is not a valid value: ${validUnits}`);
                }
                else if (inputs.options.exclude.length !== 0 && _.difference(inputs.options.exclude, validExcludes).length !== 0) {
                    return exits.invalidOptions(`Your exclude option (${inputs.options.exclude}) is not a valid value: ${validExcludes}`);
                }
                else if (!_.includes(validLanguages, inputs.options.lang)) {
                    return exits.invalidOptions(`Your language option (${inputs.options.lang}) is not a valid value: ${validLanguages}`);
                }
                else if (!moment(inputs.time).isValid()) {
                    return exits.invalidOptions(`Your time input (${inputs.time}) is an invalid date format as accepted by the Moment.js library.`);
                }
            }
            else {
                return true;
            }
        }

        /**
         * Turns the inputs.options object into query string parameters for the API request
         * @returns {string}
         */
        function stringifyOptions() {
            try {
                let queryStrings = [];
                if (inputs.options) {
                    if (inputs.options.callback) {
                        queryStrings.push(`callback=${inputs.options.callback}`);
                    }
                    if (inputs.options.units) {
                        queryStrings.push(`units=${inputs.options.units}`);
                    }
                    if (inputs.options.exclude.length !== 0) {
                        queryStrings.push(`exclude=${inputs.options.exclude.join(',')}`);
                    }
                    if (inputs.options.lang) {
                        queryStrings.push(`lang=${inputs.options.lang}`);
                    }
                    return '?' + queryStrings.join(',');
                }
                else {
                    return '';
                }
            }
            catch (e) {
                return exits.error(`Error turning options object into query string parameters: ${e}`);
            }
        }

        // Validate the inputs and then get the weather
        try {
            if (validateInputs()) {

                // Turn options object into query string parameters
                const stringifiedOptions = inputs.options ? stringifyOptions() : '';

                // Get the forecast from forecast.io
                getForecast(inputs.lat, inputs.lng, moment(inputs.time, inputs.timeFormat).format('X'), stringifiedOptions)
                    .then(weather => {
                        return exits.success(weather);
                    })
                    .catch(err => {
                        return exits.error(`An error occurred while getting the weather from forecast.io: ${err.message}`);
                    })
                ;
            }
        }
        catch (e) {
            return exits.error(`An unexpected error occurred: ${e}`);
        }
    }
};