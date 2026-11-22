const SUNLIGHT_BY_ZIP_PREFIX = {
  850: 6.5,
  851: 6.5,
  852: 6.5,
  853: 6.5,
  855: 6.5,
  856: 6.3,
  857: 6.3,
  900: 5.8,
  902: 5.8,
  906: 5.5,
  910: 5.5,
  920: 5.9,
  930: 5.6,
  940: 5.3,
  945: 5.1,
  950: 5.3,
  960: 4.9,
  750: 5.5,
  755: 5.5,
  760: 5.4,
  770: 5.6,
  775: 5.6,
  780: 5.5,
  787: 5.5,
  790: 5.3,
  320: 5.3,
  330: 5.3,
  333: 5.2,
  340: 5.2,
  346: 5.1,
  889: 6.4,
  890: 6.4,
  891: 6.1,
  100: 4.2,
  110: 4.2,
  112: 4.2,
  114: 4.2,
  116: 4.2,
  117: 4.2,
  118: 4.2,
  119: 4.2,
  800: 5.4,
  802: 5.4,
  804: 5.4,
  809: 5.4,
  810: 5.2,
  816: 5.2,
  970: 4.1,
  971: 4.1,
  972: 4.0,
  980: 3.9,
  981: 3.9,
  982: 4.0,
  983: 4.1,
};

function getSunlightHours(zip) {
  const prefix = parseInt(zip.substring(0, 3), 10);
  return SUNLIGHT_BY_ZIP_PREFIX[prefix] ?? 4.8;
}

const UTILITY_RATE_BY_ZIP_PREFIX = {
  100: 0.22,
  110: 0.22,
  940: 0.25,
  945: 0.25,
  950: 0.24,
  980: 0.14,
  970: 0.13,
  750: 0.12,
  770: 0.12,
  787: 0.12,
  320: 0.13,
  330: 0.13,
  850: 0.12,
  890: 0.12,
  800: 0.14,
};

function getUtilityRate(zip) {
  const prefix = parseInt(zip.substring(0, 3), 10);
  return UTILITY_RATE_BY_ZIP_PREFIX[prefix] ?? 0.14;
}

function getStateIncentive(zip) {
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (prefix >= 940 && prefix <= 961) return 0.10;
  if (prefix >= 100 && prefix <= 119) return 0.06;
  if (prefix >= 800 && prefix <= 816) return 0.04;
  if (prefix >= 980 && prefix <= 983) return 0.08;
  return 0;
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { monthlyBill, roofSqFt, zip } = body;

  if (!monthlyBill || !roofSqFt || !zip) {
    return new Response(JSON.stringify({ error: 'Missing required fields: monthlyBill, roofSqFt, zip' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (typeof monthlyBill !== 'number' || monthlyBill < 10 || monthlyBill > 10000) {
    return new Response(JSON.stringify({ error: 'monthlyBill must be a number between 10 and 10000' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (typeof roofSqFt !== 'number' || roofSqFt < 50 || roofSqFt > 20000) {
    return new Response(JSON.stringify({ error: 'roofSqFt must be a number between 50 and 20000' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!/^\d{5}$/.test(zip)) {
    return new Response(JSON.stringify({ error: 'zip must be a 5-digit US ZIP code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sunHours = getSunlightHours(zip);
  const utilityRate = getUtilityRate(zip);
  const stateIncentive = getStateIncentive(zip);

  const usableRoof = roofSqFt * 0.75;
  const numPanels = Math.floor(usableRoof / 20);
  const systemKw = numPanels * 0.4;
  const annualKwh = systemKw * sunHours * 365 * 0.80;

  const annualBill = monthlyBill * 12;
  const currentKwhUsage = annualBill / utilityRate;

  const solarOffsetKwh = Math.min(annualKwh, currentKwhUsage);
  const solarOffsetPct = Math.round((solarOffsetKwh / currentKwhUsage) * 100);
  const annualSavings = solarOffsetKwh * utilityRate;
  const monthlyReduction = annualSavings / 12;

  const systemCostBeforeIncentives = systemKw * 3000;
  const federalITC = systemCostBeforeIncentives * 0.30;
  const stateCredit = systemCostBeforeIncentives * stateIncentive;
  const netSystemCost = systemCostBeforeIncentives - federalITC - stateCredit;

  const paybackYears = annualSavings > 0 ? netSystemCost / annualSavings : 0;

  let lifetimeSavings = 0;
  let degradation = 1.0;
  for (let yr = 1; yr <= 25; yr += 1) {
    lifetimeSavings += annualSavings * degradation;
    degradation *= 0.995;
  }

  const co2OffsetTons = (solarOffsetKwh * 0.386) / 1000;
  const treesEquivalent = Math.round(co2OffsetTons * 45);

  const result = {
    systemKw: parseFloat(systemKw.toFixed(2)),
    numPanels,
    sunlightHoursPerDay: sunHours,
    utilityRatePerKwh: utilityRate,
    annualSavings: parseFloat(annualSavings.toFixed(2)),
    monthlyReduction: parseFloat(monthlyReduction.toFixed(2)),
    solarOffsetPercent: solarOffsetPct,
    annualKwhProduced: Math.round(annualKwh),
    systemCostBeforeIncentives: Math.round(systemCostBeforeIncentives),
    federalITC: Math.round(federalITC),
    stateCredit: Math.round(stateCredit),
    netSystemCost: Math.round(netSystemCost),
    paybackYears: parseFloat(paybackYears.toFixed(1)),
    lifetimeSavings25yr: Math.round(lifetimeSavings),
    co2OffsetTonsPerYear: parseFloat(co2OffsetTons.toFixed(2)),
    treesEquivalentPerYear: treesEquivalent,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
