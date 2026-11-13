/**
 * Single source of truth for indicative currency conversion.
 * The client and the analytics endpoint must agree, so the server owns the rate
 * and exposes it in API responses. Override with XRP_TO_ZAR_RATE in .env.
 *
 * Default: 10 XRP stipend ~= R1,650  =>  1 XRP = R165
 */
const parsed = Number(process.env.XRP_TO_ZAR_RATE);
const XRP_TO_ZAR_RATE = Number.isFinite(parsed) && parsed > 0 ? parsed : 165;

const xrpToZar = (xrp) => Math.round(Number(xrp || 0) * XRP_TO_ZAR_RATE * 100) / 100;

module.exports = { XRP_TO_ZAR_RATE, xrpToZar };
