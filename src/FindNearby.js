const permissionArray = ['read::alexa:device:all:address'];

const googleMapsClient = require('@google/maps').createClient({ key: process.env.GOOGLE_MAPS_GECODING_API_KEY });
const GoogleLocations = require('google-locations');
const locations = new GoogleLocations(process.env.GOOGLE_MAPS_GECODING_API_KEY);

class findNearby {
    constructor(apiEndpoint, deviceId, consentToken) {
        console.log("Creating AlexaAddressClient instance.");
        this.item = item;
        this.address = address;
    }

    search() {
        const query = {
            keyword: 'recycle ' + this.item,
            location: this.getLatLng(this.address),
            radius: 1000,
            rankby: 'distance'
        };
        locations.search(query, function(err, response) {
            if(!err) {	
                console.log("search: ", response.results);
                
                // locations.details({placeid: response.results[0].place_id}, function(err, response) {
                // 	console.log("search details: ", response.result.name);
                // 	// search details: Google 
                // });

                return response.results;
            } else {
                console.log(err);
            }	
            });
    }

    getLatLng(address) {
        // Geocode an address.
        googleMapsClient.geocode({
        address: address
        }, function(err, response) {
        if (!err) {
            var results = (response.json.results[0].geometry.location);
            console.log(response);
            console.log(results);
            var location = new Array();
            location.push(results.lat);
            location.push(results.lng);
            console.log(location);
            return location;
        } else {
            console.log(err);
        }
        });
    }
}

module.exports = FindNearby;