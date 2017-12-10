var request = require('request');

var baseUrl = 'https://fcm.googleapis.com/fcm/send'

module.exports = function SimpleFcm(fcmKey) {
    if (!fcmKey) return console.error('Need to pass the server key');

    var headers = {
        'content-type': 'application/json',
        authorization: 'key= '+ fcmKey
    }

    this.send = (payload) => {
        return new Promise(function(resolve, reject) {

            if(!payload.to && !payload.condition){
                return reject('need \'to\' or \'condition\' param')
            }

            var options = {
                method: 'POST',
                url: baseUrl,
                headers: headers,
                json: true,
                body: payload,
            };

            return request(options, (error, response, body) => {
                if (error) return reject(error)

                resolve(body)
            });

        });
    }
}
