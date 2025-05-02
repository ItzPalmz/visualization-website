const coins = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' }
];

async function fetchCryptoData() {
  const ids = coins.map(c => c.id).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=thb&ids=${ids}&sparkline=true`;

  const response = await fetch(url);
  const data = await response.json();

  const tableBody = document.getElementById("crypto-table");
  tableBody.innerHTML = '';

  data.forEach(c => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${c.name}</strong> <br><span style="color:gray">${c.symbol.toUpperCase()}</span></td>
      <td>THB ${c.current_price.toLocaleString()}</td>
      <td><svg width="100" height="30" id="sparkline-${c.id}"></svg></td>
      <td style="color: ${c.price_change_percentage_24h >= 0 ? 'green' : 'red'}">
        ${c.price_change_percentage_24h >= 0 ? '↑' : '↓'} ${c.price_change_percentage_24h.toFixed(2)}%
      </td>
      <td>THB ${formatTrillion(c.market_cap)}</td>
      <td>THB ${formatTrillion(c.total_volume)}</td>
      <td><button class="view-btn" data-id="${c.id}" data-name="${c.name}">View Graph</button></td>
    `;
    tableBody.appendChild(row);
  });

  drawMiniCharts(data);
  bindGraphButtons();
}

function drawMiniCharts(data) {
  data.forEach(c => {
    const svg = d3.select(`#sparkline-${c.id}`);
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const prices = c.sparkline_in_7d.price.slice(-30);
    const x = d3.scaleLinear().domain([0, prices.length - 1]).range([0, width]);
    const y = d3.scaleLinear().domain([d3.min(prices), d3.max(prices)]).range([height, 0]);

    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveBasis);

    svg.append("path")
      .datum(prices)
      .attr("fill", "none")
      .attr("stroke", "#007bff")
      .attr("stroke-width", 2)
      .attr("d", line);
  });
}

function formatTrillion(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toLocaleString();
}

// Modal + Chart.js logic
let modal = document.getElementById("modal");
let closeBtn = document.querySelector(".close");
let chart;

closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

function bindGraphButtons() {
  document.querySelectorAll(".view-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const coinId = button.dataset.id;
      const coinName = button.dataset.name;

      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=thb&days=7`);
      const json = await response.json();

      const labels = json.prices.map(p => new Date(p[0]).toLocaleDateString());
      const prices = json.prices.map(p => p[1]);

      if (chart) chart.destroy();

      const ctx = document.getElementById("priceChart").getContext("2d");
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${coinName} Price (7 Days)`,
            data: prices,
            borderColor: '#007bff',
            fill: false,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { display: true },
            y: { display: true }
          }
        }
      });

      modal.style.display = "block";
    });
  });
}

// Start fetching
fetchCryptoData();
setInterval(fetchCryptoData, 10000); // refresh every 10 seconds
