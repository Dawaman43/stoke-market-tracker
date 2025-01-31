const apiKey = ''; // Replace with your Alpha Vantage API key
const searchInput = document.getElementById('stock-search');
const searchBtn = document.getElementById('search-btn');
const suggestionsList = document.getElementById('suggestions');
const subscriptionSection = document.getElementById('subscription-section');
const stockDetails = document.getElementById('stock-details');
const stockName = document.getElementById('stock-name');
const priceChartCanvas = document.getElementById('price-chart').getContext('2d');
const indicatorsList = document.getElementById('indicators-list');
const reportsList = document.getElementById('reports-list');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const emailInput = document.getElementById('email-input');
const subscribeBtn = document.getElementById('subscribe-btn');
const newsSection = document.getElementById('news-section');
const newsList = document.getElementById('news-list');
const compareStockInput = document.getElementById('compare-stock');
const compareBtn = document.getElementById('compare-btn');
const comparisonChartCanvas = document.getElementById('comparison-chart').getContext('2d');
const comparisonSection = document.getElementById('comparison-section');

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('night-mode');
    stockDetails.classList.toggle('night-mode');
    newsSection.classList.toggle('night-mode');
    comparisonSection.classList.toggle('night-mode');
    stockName.classList.toggle('night-mode');
    document.querySelectorAll('#technical-indicators h3, #financial-reports h3').forEach(el => el.classList.toggle('night-mode'));
    document.querySelectorAll('#technical-indicators li, #financial-reports li').forEach(el => el.classList.toggle('night-mode'));
    document.querySelectorAll('#news-section li').forEach(el => el.classList.toggle('night-mode'));

    if (document.body.classList.contains('night-mode')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
});

// Live Suggestions
searchInput.addEventListener('input', async (event) => {
    const query = event.target.value.trim();
    if (query.length > 2) {
        try {
            const response = await axios.get(`https://www.alphavantage.co/query`, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords: query,
                    apikey: apiKey
                }
            });
            const symbols = response.data.bestMatches;
            renderSuggestions(symbols);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    } else {
        suggestionsList.innerHTML = '';
    }
});

suggestionsList.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
        const symbol = event.target.dataset.symbol;
        searchInput.value = symbol;
        suggestionsList.innerHTML = '';
        fetchStockData(symbol);
        subscriptionSection.style.display = 'block';
    }
});

function renderSuggestions(symbols) {
    suggestionsList.innerHTML = '';
    symbols.forEach(symbol => {
        const li = document.createElement('li');
        li.textContent = `${symbol['1. symbol']} - ${symbol['2. name']}`;
        li.dataset.symbol = symbol['1. symbol'];
        suggestionsList.appendChild(li);
    });
}

// Fetch Stock Data
searchBtn.addEventListener('click', async () => {
    const symbol = searchInput.value.trim().toUpperCase();
    if (symbol) {
        await fetchStockData(symbol);
        subscriptionSection.style.display = 'block';
    }
});

async function fetchStockData(symbol) {
    try {
        const timeSeriesData = await fetchTimeSeries(symbol);
        const technicalIndicators = await fetchTechnicalIndicators(symbol);
        const financialReports = await fetchFinancialReports(symbol);
        const news = await fetchNews(symbol);

        renderStockDetails(symbol, timeSeriesData, technicalIndicators, financialReports);
        renderNews(news);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data. Please try again.');
    }
}

async function fetchTimeSeries(symbol) {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
            function: 'TIME_SERIES_DAILY',
            symbol: symbol,
            apikey: apiKey
        }
    });
    return response.data['Time Series (Daily)'];
}

async function fetchTechnicalIndicators(symbol) {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
            function: 'SMA',
            symbol: symbol,
            interval: 'daily',
            time_period: 10,
            series_type: 'close',
            apikey: apiKey
        }
    });
    return response.data['Technical Analysis: SMA'];
}

async function fetchFinancialReports(symbol) {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
            function: 'OVERVIEW',
            symbol: symbol,
            apikey: apiKey
        }
    });
    return response.data;
}

async function fetchNews(symbol) {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
            function: 'NEWS_SENTIMENT',
            tickers: symbol,
            apikey: apiKey
        }
    });
    return response.data.feed;
}

function renderStockDetails(symbol, timeSeriesData, technicalIndicators, financialReports) {
    stockDetails.style.display = 'block';
    stockName.textContent = `Stock Details for ${symbol}`;

    // Render 3D Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, 400);
    document.getElementById('3d-container').appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = 400;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    // Render Price Chart
    const dates = Object.keys(timeSeriesData).reverse();
    const prices = dates.map(date => parseFloat(timeSeriesData[date]['4. close']));

    const priceChart = new Chart(priceChartCanvas, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Close Price',
                data: prices,
                borderColor: '#007bff',
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price'
                    }
                }
            }
        }
    });

    // Render Technical Indicators
    indicatorsList.innerHTML = '';
    for (const date in technicalIndicators) {
        const smaValue = technicalIndicators[date]['SMA'];
        const listItem = document.createElement('li');
        listItem.textContent = `${date}: SMA = ${smaValue}`;
        indicatorsList.appendChild(listItem);
    }

    // Render Financial Reports
    reportsList.innerHTML = '';
    for (const key in financialReports) {
        const value = financialReports[key];
        const listItem = document.createElement('li');
        listItem.textContent = `${key}: ${value}`;
        reportsList.appendChild(listItem);
    }

    // Smooth Animation for Showing Sections
    gsap.to(subscriptionSection, { duration: 1, opacity: 1, display: 'block' });
    gsap.to(stockDetails, { duration: 1, opacity: 1, display: 'block' });
}

// Email Subscription
subscribeBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (email) {
        alert(`Thank you for subscribing with ${email}!`);
        emailInput.value = '';
    } else {
        alert('Please enter a valid email address.');
    }
});

// Fetch News
function renderNews(news) {
    newsSection.style.display = 'block';
    newsList.innerHTML = '';
    news.slice(0, 5).forEach(article => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${article.title}</strong><br>${article.summary}`;
        newsList.appendChild(li);
    });
}

// Compare Stocks
compareBtn.addEventListener('click', async () => {
    const symbol1 = searchInput.value.trim().toUpperCase();
    const symbol2 = compareStockInput.value.trim().toUpperCase();
    if (symbol1 && symbol2) {
        await compareStocks(symbol1, symbol2);
    }
});

async function compareStocks(symbol1, symbol2) {
    try {
        const timeSeriesData1 = await fetchTimeSeries(symbol1);
        const timeSeriesData2 = await fetchTimeSeries(symbol2);

        renderComparisonChart(symbol1, symbol2, timeSeriesData1, timeSeriesData2);
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        alert('Failed to fetch comparison data. Please try again.');
    }
}

function renderComparisonChart(symbol1, symbol2, timeSeriesData1, timeSeriesData2) {
    comparisonSection.style.display = 'block';

    const dates1 = Object.keys(timeSeriesData1).reverse();
    const dates2 = Object.keys(timeSeriesData2).reverse();
    const prices1 = dates1.map(date => parseFloat(timeSeriesData1[date]['4. close']));
    const prices2 = dates2.map(date => parseFloat(timeSeriesData2[date]['4. close']));

    const comparisonChart = new Chart(comparisonChartCanvas, {
        type: 'line',
        data: {
            labels: dates1,
            datasets: [
                {
                    label: symbol1,
                    data: prices1,
                    borderColor: '#007bff',
                    fill: false
                },
                {
                    label: symbol2,
                    data: prices2,
                    borderColor: '#ff6384',
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price'
                    }
                }
            }
        }
    });

    // Smooth Animation for Showing Sections
    gsap.to(comparisonSection, { duration: 1, opacity: 1, display: 'block' });
}