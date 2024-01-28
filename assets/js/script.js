// Ignoring that this wouldnt be best practice and would usually be fetched from backend where we would use process.env.
var KEY = 'af22f589c706c6e9db1fac3c65d9d723';

var form = $('#search');

// Handle searches
form.on('submit', goSearch);

// If there is a city in localstorage then prepopulate the page
function getExisting(){
    if(localStorage.getItem('lastCity') != undefined){
        var data = localStorage.getItem('lastCity') || '';
        
        //break if empty
        if(data == ''){
            return;
        }

        data = JSON.parse(data);

        var weatherData = data['weatherData'];
        var city = data['city'];

        // break if empty
        if(!weatherData || !city){
            return;
        }

        //Populate Page
        populateToday(weatherData.today, city);
        var remainingWeather = weatherData;
        delete remainingWeather['today'];

        populateFiveDay(remainingWeather);
    }
}
getExisting();


//Handles adding a city button in history
function addHistory(data) {

    
    //Create a city button for quick access
    var history = $('.history');
    var button = $('<button>').text(data.city);
    button.data('weatherData', data.weatherData); // using jquery built in data storing feature
    button.data('city', data.city); // using jquery built in data storing feature
    button.attr('id', `#history-${data.city}`);
    button.attr('onclick', 'cityButton(event)');
    history.append(button);
}

// Handles clicking history button
function cityButton({ target }) {

    // Get data from element
    var city = $(target).data('city');
    var weatherData = $(target).data('weatherData');

    // Populate page with weather from past city
    populateToday(weatherData.today, city);
    var remainingWeather = { ...weatherData };
    delete remainingWeather['today'];
    populateFiveDay(remainingWeather);
}

// Run City Search
async function goSearch(event) {
    event.preventDefault();
    var { target } = event;

    var input = $(target).children()[0];
    var city = $(input).val()

    $('#city').val('')
    
    // Check for undefined values and trigger error
    if(city == {} || city == undefined) {
        console.error("No Search Entry");
        return;
    }

    // Get Coordinates of City  
    var coord = await getCoord(city);

    // break if city doesn't exist
    if(coord == 'No City Found') {
        return 'Coordinates Not Found';
    }

    // Destructure coord
    var { lat, lon } = coord;

    // Get Weather  
    var weatherData = await getWeather(lat, lon) || {};

    
    if(weatherData == {}) {
        console.error("No Weather Returned");
        return;
    }

    // Object for storage and parsing
    var dataToStore = {
        city: city,
        weatherData: { ...weatherData }
    };
    
    
    localStorage.setItem('lastCity', JSON.stringify(dataToStore));// Add as last city in local storage
    addHistory(dataToStore); //Make city histroy button

    // Populate page
    populateToday(weatherData.today, city);
    var remainingWeather = { ...weatherData };
    delete remainingWeather['today'];

    populateFiveDay(remainingWeather);

    
    
}

// Get Coordinates
async function getCoord(city) {
    try{
        // Accounting for spaces in city name e.g. San Deigo needs %20
        city = encodeURI(city);
        var url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${KEY}`
        var response = await fetch(url);

        if (response.status !== 200) {
            throw new Error("Failed to fetch coordinate data");
        }

        

            var data = await response.json();

            if(data.length == 0){
                return 'No City Found';
            }

            var lat = data[0].lat;
            var lon = data[0].lon;

            return { lat,lon };
        

    } catch(error) {

        console.error(error);

    }
}

// Get weather with coordinates
async function getWeather(lat, lon) {
    try {

        url =  `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${KEY}`;
        

        var response = await fetch(url);

        if (response.status !== 200) {
            throw new Error("Failed to fetch weather data");
        }
        
        var data = await response.json();

        // Returning an object containing only the 6 days we are after  
        return { 'today': data.list[1], 'dayOne': data.list[6], 'dayTwo': data.list[14], 'dayThree': data.list[22], 'dayFour': data.list[25], 'dayFive': data.list[30] };

        

    } catch(error) {
        console.error(error);
    }
}

// Populate Today's Weather Section
function populateToday(weatherToday, city){

    var today = $('.today');
    today.text('');
    var span = $('<span>');

    // Structure Date
    const date = new Date(weatherToday.dt_txt);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // January is 0!
    const year = date.getFullYear();


    var h3 = $('<h3>').text(`${city} (${day}/${month}/${year})`);
    var icon = $('<img>').attr('src', `https://openweathermap.org/img/wn/${weatherToday.weather[0].icon}@2x.png`);


    span.append(h3, icon);

    var temp = $('<p>').text(`Temp: ${weatherToday.main.temp} °C`);
    var wind = $('<p>').text(`Wind: ${weatherToday.wind.speed} KPH`);
    var humidity = $('<p>').text(`Humidity: ${weatherToday.main.humidity}%`);


    today.append(span, temp, wind, humidity);
}

// Need I explain this...
function populateFiveDay(weather){

    var cards = $('.cards');
    cards.text('');

    // Loop through each weather object for each card
    for (var obj in weather){
        var dayItem = weather[obj];
        var imgUrl = `https://openweathermap.org/img/wn/${dayItem.weather[0].icon}@2x.png`; //icon url
        var card = $('<div>').addClass('card');
        
        // Date formatting
        var dateFormat = new Date(dayItem.dt_txt);
        var day = dateFormat.getDate().toString().padStart(2, '0');
        var month = (dateFormat.getMonth() + 1).toString().padStart(2, '0'); // January is 0!
        var year = dateFormat.getFullYear();

        var date = $('<p>').text(`${day}/${month}/${year}`);
        var img = $('<img>').attr('src', imgUrl)
        var temp = $('<p>').text(`Temp: ${dayItem.main.temp} °C`);
        var wind = $('<p>').text(`Wind: ${dayItem.wind.speed} KPH`);
        var humidity = $('<p>').text(`Humidity: ${dayItem.main.humidity}%`);

        card.append(date, img, temp, wind, humidity);

        cards.append(card);
    }
    

}


