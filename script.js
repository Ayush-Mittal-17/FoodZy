async function fetchWeather(city = null) {
    const weatherDataSection = document.getElementById("weather-data");
    weatherDataSection.style.display = "block";
    const apiKey = "0164f23c55096b2e7b5fad1f25e44703";
    let searchInput = city || document.getElementById("search").value.trim();

    const userTaste = document.getElementById("taste-select")?.value || "none";

    if (!searchInput) {
        weatherDataSection.innerHTML = `
        <div>
          <h2>Empty Input!</h2>
          <p>Please enter a valid <u>city name</u>.</p>
        </div>
        `;
        return;
    }

    async function getLonAndLat() {
        const geocodeURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchInput)}&limit=1&appid=${apiKey}`;
        try {
            const response = await fetch(geocodeURL);
            if (!response.ok) throw new Error(`Geocode API Error: ${response.status}`);
            const data = await response.json();
            if (data.length === 0) {
                weatherDataSection.innerHTML = `<h2>Invalid Input: "${searchInput}"</h2><p>Try again with a valid city name.</p>`;
                return null;
            }
            return data[0];
        } catch (error) {
            console.error(error);
            weatherDataSection.innerHTML = `<p>Error fetching location data. Try again later.</p>`;
            return null;
        }
    }

    async function getWeatherData(lon, lat, cityName) {
        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        try {
            const response = await fetch(weatherURL);
            if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
            const data = await response.json();

            weatherDataSection.style.display = "flex";
            weatherDataSection.innerHTML = `
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="${data.weather[0].description}" width="100" />
            <div>
              <h2>${cityName || data.name}</h2>
              <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
              <p><strong>Description:</strong> ${data.weather[0].description}</p>
              <h3>🍽️ Popular Food in ${cityName}</h3>
              <div id="zomato-food">
                <p>Loading food items...</p>
              </div>
              <div id="food-recommendations">
                <p>Loading recommendations...</p>
              </div>
            </div>
            `;

            fetchZomatoFood(cityName);
            suggestFoodBasedOnWeather(data.main.temp, data.weather[0].main, userTaste);

        } catch (error) {
            console.error(error);
            weatherDataSection.innerHTML = `<p>Error fetching weather data. Try again later.</p>`;
        }
    }

    async function fetchZomatoFood(city) {
        const zomatoFoodSection = document.getElementById("zomato-food");

        if (!city) {
            zomatoFoodSection.innerHTML = `<p>Unable to get city name.</p>`;
            return;
        }

        const zomatoURL = `https://www.zomato.com/${city.toLowerCase().replace(/\s+/g, "-")}/delivery`;

        zomatoFoodSection.innerHTML = `
            <p>Click below to explore food in ${city}:</p>
            <a href="${zomatoURL}" target="_blank">🍽️ View Food in ${city} on Zomato</a>
        `;
    }

    function suggestFoodBasedOnWeather(temp, weatherCondition, tastePreference) {
        const foodSection = document.getElementById("food-recommendations");

        let category = "mild";
        if (temp > 30) category = "hot";
        else if (temp < 10) category = "cold";
        else if (weatherCondition.toLowerCase().includes("rain")) category = "rainy";

        const adminData = JSON.parse(localStorage.getItem("adminFoodData") || "{}");
        let recommendations = (adminData[category] || []).filter(food =>
            tastePreference === "none" || food.taste === tastePreference
        );

        if (recommendations.length === 0) {
            const defaultData = {
                hot: [
                    { name: "Cold Coffee", taste: "sweet" },
                    { name: "Salads", taste: "veg" },
                    { name: "Ice Cream", taste: "sweet" },
                    { name: "Fruit Juices", taste: "sweet" },
                    { name: "Sushi", taste: "nonveg" }
                ],
                cold: [
                    { name: "Hot Chocolate", taste: "sweet" },
                    { name: "Soup", taste: "veg" },
                    { name: "Spicy Curries", taste: "spicy" },
                    { name: "Pasta", taste: "veg" },
                    { name: "Biryani", taste: "nonveg" }
                ],
                rainy: [
                    { name: "Pakoras", taste: "spicy" },
                    { name: "Chai", taste: "sweet" },
                    { name: "Hot Soup", taste: "veg" },
                    { name: "Maggi", taste: "veg" },
                    { name: "Samosa", taste: "spicy" }
                ],
                mild: [
                    { name: "Pasta", taste: "veg" },
                    { name: "Sandwiches", taste: "veg" },
                    { name: "Grilled Chicken", taste: "nonveg" },
                    { name: "Tacos", taste: "nonveg" },
                    { name: "Pizza", taste: "veg" }
                ]
            };
            recommendations = (defaultData[category] || []).filter(food =>
                tastePreference === "none" || food.taste === tastePreference
            );
        }

        if (recommendations.length === 0) {
            foodSection.innerHTML = `<p>No food matches your taste preference for this weather.</p>`;
            return;
        }

        const stats = JSON.parse(localStorage.getItem("recommendationStats") || '{}');
        recommendations.forEach(food => {
            if (!stats[food.name]) stats[food.name] = 0;
            stats[food.name] += 1;
        });
        localStorage.setItem("recommendationStats", JSON.stringify(stats));

        foodSection.innerHTML = `
            <h4>🍛 Personalized Food Recommendations</h4>
            <ul style="list-style: none; padding: 0;">
                ${recommendations.map(food => `
                    <li style="margin-bottom: 8px;">
                        <span>${food.name}</span>
                    </li>
                `).join("")}
            </ul>
        `;
    }

    document.getElementById("search").value = "";
    const geocodeData = await getLonAndLat();
    if (geocodeData) {
        await getWeatherData(geocodeData.lon, geocodeData.lat, geocodeData.name);
    }
}

async function fetchWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const { latitude, longitude } = position.coords;
            const reverseGeocodeURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=0164f23c55096b2e7b5fad1f25e44703`;

            try {
                const response = await fetch(reverseGeocodeURL);
                if (!response.ok) throw new Error("Reverse geocode API error");
                const data = await response.json();
                if (data.length > 0) {
                    fetchWeather(data[0].name);
                } else {
                    alert("Unable to fetch city name. Try again.");
                }
            } catch (error) {
                console.error("Error fetching location data:", error);
                alert("Failed to get your location. Try again.");
            }
        }, error => {
            console.error("Geolocation Error:", error.message);
            alert("Location access denied. Please enable location access.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const gpsButton = document.getElementById("gps-button");
    gpsButton.addEventListener("click", fetchWeatherByLocation);
});