 // ---- ÉTAT GLOBAL ----
    let stocks = [];
    let selectedStock = null;
    let priceChart = null;
    let comparisonChart = null;
    let profitLossChart = null;
    let candlestickChart = null;

    // ---- AU CHARGEMENT ----
    window.addEventListener("load", () => {
      loadStocks();
      updateDisplay();
    });

    // ---- AJOUT ACTION ----
    document.getElementById("addStockForm").addEventListener("submit", (e) => {
      e.preventDefault();

      const ticker = document.getElementById("ticker").value.trim().toUpperCase();
      if (!ticker) {
        alert("Veuillez entrer un ticker (ex: AAPL)");
        return;
      }

      const history = generateFakeHistory();
      const currentPrice = history[history.length - 1].price;

      const stock = {
        id: Date.now(),
        ticker,
        history,
        currentPrice,
      };

      stocks.push(stock);
      saveStocks();
      updateDisplay();
      document.getElementById("addStockForm").reset();
    });

    // ---- GÉNÉRATION FAKE DATA ----
    function generateFakeHistory() {
      const data = [];
      let price = Math.random() * 100 + 50;

      for (let i = 9; i >= 0; i--) {
        price += (Math.random() - 0.5) * 5;
        data.push({
          date: new Date(Date.now() - i * 86400000).toISOString(),
          price: Number(price.toFixed(2)),
        });
      }
      return data;
    }

    // ---- AFFICHAGE LISTE ----
    function updateStockList() {
      const container = document.getElementById("stockList");

      if (stocks.length === 0) {
        container.innerHTML = "<p>Aucune action ajoutée</p>";
        return;
      }

      container.innerHTML = stocks
        .map(
          (s) => `
          <div class="stock-item">
            <div class="stock-info">
              <strong style="font-size: 18px; color: #667eea;">${s.ticker}</strong><br>
              <span style="color: #666;">Dernier prix : <strong>${s.currentPrice} €</strong></span>
            </div>
            <div class="stock-actions">
              <button onclick="showChart(${s.id})">📊 Voir</button>
              <button onclick="removeStock(${s.id})" style="background: #e74c3c;">🗑️</button>
            </div>
          </div>
        `,
        )
        .join("");
    }

    // ---- SUPPRESSION ----
    function removeStock(id) {
      stocks = stocks.filter((s) => s.id !== id);
      saveStocks();
      updateDisplay();
    }

    // ---- GRAPHE 10 JOURS (AVEC API) ----
    async function showChart(id) {
      selectedStock = stocks.find((s) => s.id === id);
      if (!selectedStock) return;

      // Charger les données réelles de l'API
      const url = `https://stooq.com/q/d/l/?s=${selectedStock.ticker.toLowerCase()}.us&i=d`;

      try {
        const res = await fetch(url);
        const text = await res.text();

        const lines = text.split("\n").slice(1);
        const realData = [];

        lines.forEach((line) => {
          const [date, open, high, low, close] = line.split(",");
          if (!date || !close) return;

          realData.push({
            date: date,
            price: parseFloat(close)
          });
        });

        if (realData.length === 0) {
          alert("Aucune donnée trouvée pour " + selectedStock.ticker);
          return;
        }

        // Prendre les 30 derniers jours
        const last30Days = realData.slice(-30);

        const ctx = document.getElementById("priceChart").getContext("2d");

        const labels = last30Days.map((h) =>
          new Date(h.date).toLocaleDateString("fr-FR")
        );
        const prices = last30Days.map((h) => h.price);

        if (priceChart) priceChart.destroy();

        priceChart = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: selectedStock.ticker + " (données réelles)",
                data: prices,
                borderColor: "#667eea",
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true }
            }
          }
        });

        // Mettre à jour le prix actuel avec les vraies données
        selectedStock.currentPrice = prices[prices.length - 1];
        selectedStock.history = last30Days;
        saveStocks();
        updateStockList();

      } catch (error) {
        console.error("Erreur chargement données:", error);
        alert("Impossible de charger les données pour " + selectedStock.ticker);
      }
    }

    // ---- COMPARAISON ----
    function updateComparison() {
      if (stocks.length < 2) return;

      const s1 = stocks[0];
      const s2 = stocks[1];

      const ctx = document.getElementById("comparisonChart").getContext("2d");

      if (comparisonChart) comparisonChart.destroy();

      comparisonChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: s1.history.map((h) => new Date(h.date).toLocaleDateString("fr-FR")),
          datasets: [
            {
              label: s1.ticker,
              data: s1.history.map((h) => h.price),
              borderColor: "#667eea",
              tension: 0.4,
            },
            {
              label: s2.ticker,
              data: s2.history.map((h) => h.price),
              borderColor: "#e74c3c",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // ---- PROFIT / LOSS ----
    function calculateProfitLoss() {
      if (!selectedStock) {
        alert("Sélectionnez d'abord une action via 'Voir'");
        return;
      }

      const startDate = new Date(document.getElementById("startDate").value);
      const endDate = new Date(document.getElementById("endDate").value);

      if (!document.getElementById("startDate").value || !document.getElementById("endDate").value) {
        alert("Veuillez sélectionner les deux dates");
        return;
      }

      const values = [];
      const labels = [];
      const basePrice = selectedStock.history[0].price;

      selectedStock.history.forEach((h) => {
        const hDate = new Date(h.date);
        if (hDate >= startDate && hDate <= endDate) {
          labels.push(hDate.toLocaleDateString("fr-FR"));
          values.push(h.price - basePrice);
        }
      });

      const ctx = document.getElementById("profitLossChart").getContext("2d");

      if (profitLossChart) profitLossChart.destroy();

      profitLossChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Profit / Loss (€)",
            data: values,
            borderColor: values[values.length - 1] >= 0 ? "#27ae60" : "#e74c3c",
            backgroundColor: values[values.length - 1] >= 0 ? "rgba(39, 174, 96, 0.1)" : "rgba(231, 76, 60, 0.1)",
            fill: true,
            tension: 0.4
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // ---- LOCAL STORAGE ----
    function saveStocks() {
      try {
        const data = JSON.stringify(stocks);
        window.localStorage.setItem("stocks", data);
      } catch (e) {
        console.error("Erreur sauvegarde:", e);
      }
    }

    function loadStocks() {
      try {
        const data = window.localStorage.getItem("stocks");
        if (data) {
          stocks = JSON.parse(data);
        }
      } catch (e) {
        console.error("Erreur chargement:", e);
        stocks = [];
      }
    }

    // ---- GLOBAL UPDATE ----
    function updateDisplay() {
      updateStockList();
      updateComparison();
    }

    // ---- STOOQ API ----
    async function loadStooqData() {
      const ticker = document.getElementById("ticker").value.trim().toUpperCase();
      if (!ticker) return alert("Entrez un ticker");

      const url = `https://stooq.com/q/d/l/?s=${ticker.toLowerCase()}.us&i=d`;

      try {
        const res = await fetch(url);
        const text = await res.text();

        const lines = text.split("\n").slice(1);
        const ohlc = [];

        lines.forEach((line) => {
          const [date, open, high, low, close] = line.split(",");
          if (!date || !open) return;

          const timestamp = new Date(date).getTime();

          ohlc.push({
            x: timestamp,
            o: parseFloat(open),
            h: parseFloat(high),
            l: parseFloat(low),
            c: parseFloat(close)
          });
        });

        if (ohlc.length === 0) {
          alert("Aucune donnée trouvée pour ce ticker");
          return;
        }

        drawCandlestickChart(ohlc, ticker);
      } catch (error) {
        console.error("Erreur Stooq API", error);
        alert("Erreur lors du chargement des données");
      }
    }

    function drawCandlestickChart(data, ticker) {
      const ctx = document.getElementById("candlestickChart").getContext("2d");

      if (candlestickChart) candlestickChart.destroy();

      candlestickChart = new Chart(ctx, {
        type: "candlestick",
        data: {
          datasets: [{
            label: "Cours " + ticker,
            data: data
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          scales: {
            x: {
              type: "time",
              time: { unit: "day" }
            },
            y: {
              beginAtZero: false
            }
          }
        }
      });
    }