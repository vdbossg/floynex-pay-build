// M-Safe/backend/services/gatewayService.js

const axios = require("axios");

// fallback fixed rate (VERY IMPORTANT SAFETY LAYER)
const FALLBACK_USD_TO_KES = Number(process.env.USD_TO_KES || 129);

// cache rate to avoid API spam
let cachedRate = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

/**
 * Fetch live USD to KES rate
 * Using exchangerate.host (free, no API key required)
 */
async function fetchLiveRate() {
  try {
    const now = Date.now();

    // use cache if valid
    if (cachedRate && now - lastFetchTime < CACHE_TTL) {
      return cachedRate;
    }

    const response = await axios.get(
      "https://open.er-api.com/v6/latest/USD"
    );

    const rate = response.data?.rates?.KES;

    if (!rate || rate <= 0) {
      throw new Error("Invalid rate from API");
    }

    cachedRate = rate;
    lastFetchTime = now;

    return rate;
  } catch (err) {
    console.error("Rate fetch failed, using fallback:", err.message);
    return FALLBACK_USD_TO_KES;
  }
}

/**
 * Convert KES → USDT
 * (USDT ≈ USD 1:1)
 */
async function convertKEStoUSDT({ amountKES, reference }) {
  if (!amountKES || amountKES <= 0) {
    throw new Error("Invalid KES amount");
  }

  const usdToKes = await fetchLiveRate();

  // KES → USD → USDT
  const usd = amountKES / usdToKes;

  // round to 6 decimals (crypto standard)
  const usdt = Math.round(usd * 1_000_000) / 1_000_000;

  console.log(`[Gateway] ${reference || "no-ref"}: ${amountKES} KES → ${usdt} USDT`);

  return usdt;
}

module.exports = {
  convertKEStoUSDT
};