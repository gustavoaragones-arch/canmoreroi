#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const pages = [
  {
    slug: 'solara-studio',
    title: 'Solara Canmore Studio',
    monthly_revenue: 3100,
    monthly_costs: 4100,
    cash_flow: -1000,
    payback_signal: 'negative',
    definition:
      'This studio unit in Solara Canmore shows approximately -$1,000/month under typical STR assumptions — tight margins and high fixed costs per square foot.',
    reality_check: ['Studios compete on rate more than bedrooms', 'Winter demand helps but fees dominate', 'Management fees hit harder on small units'],
    verdict: {
      good_for: ['Hands-on operators', 'Owners who use the unit part-time'],
      not_ideal_for: ['Pure yield seekers', 'Highly leveraged buyers'],
    },
    faq: [
      { q: 'Can a Solara studio cash flow in Canmore?', a: 'Rarely at market pricing without very high occupancy; most models show thin or negative monthly cash after fees.' },
      { q: 'What breaks the model first?', a: 'Condo fees and financing on a small revenue base — a few empty weeks erase the margin.' },
      { q: 'Is this investment advice?', a: 'No — verify with your lender and a local property manager before buying.' },
    ],
  },
  {
    slug: 'solara-canmore-1br',
    title: 'Solara Canmore 1BR',
    monthly_revenue: 5200,
    monthly_costs: 5600,
    cash_flow: -400,
    payback_signal: 'negative',
    definition:
      'A one-bedroom at Solara under typical STR assumptions runs near -$400/month — better than a studio, still sensitive to occupancy.',
    reality_check: ['1BR competes with hotel supply', 'Shoulder season softness matters', 'Parking and in-unit amenities drive rate'],
    verdict: {
      good_for: ['Balanced personal use + STR', 'Buyers with lower leverage'],
      not_ideal_for: ['Maximum leverage plays', 'Need for guaranteed income'],
    },
    faq: [
      { q: 'Is Solara 1BR a cash-flow play?', a: 'Usually marginal; positive outcomes need strong occupancy and disciplined costs.' },
      { q: 'What occupancy makes this work?', a: 'Often north of mid-60s at modeled rates — stress-test lower before you offer.' },
      { q: 'Where can I compare 2BR?', a: 'See the Solara 2BR analysis on this site for a side-by-side signal.' },
    ],
  },
  {
    slug: 'lodges-at-canmore-2br',
    title: 'Lodges at Canmore 2BR',
    monthly_revenue: 6800,
    monthly_costs: 6000,
    cash_flow: 800,
    payback_signal: 'self-sustaining',
    definition:
      'A 2-bedroom at Lodges at Canmore can deliver roughly +$800/month under modeled STR performance — stronger bedroom count for ski-season demand.',
    reality_check: ['Resort-fee structures vary by phase', 'Management contracts differ by owner', 'Summer vs winter mix shifts revenue'],
    verdict: {
      good_for: ['STR-focused investors', 'Buyers wanting bedroom scale'],
      not_ideal_for: ['Those avoiding HOA complexity', 'Ultra-low-touch expectations without management'],
    },
    faq: [
      { q: 'Why is 2BR stronger here?', a: 'More sleeping capacity maps to ski and family groups, supporting rate and occupancy.' },
      { q: 'What should I verify in the strata docs?', a: 'Rental restrictions, fee history, and reserve fund — special levies move net fast.' },
      { q: 'Is $800/month guaranteed?', a: 'No — it is a modeled estimate; actuals vary with operations and market.' },
    ],
  },
  {
    slug: 'silvertip-luxury-chalet',
    title: 'Silvertip Luxury Chalet',
    monthly_revenue: 12000,
    monthly_costs: 12800,
    cash_flow: -800,
    payback_signal: 'negative',
    definition:
      'High-gross Silvertip luxury product can still show -$800/month when financing, taxes, and operating costs stack — gross is not net.',
    reality_check: ['Luxury turnover costs are real', 'Snow removal and utilities scale up', 'Booking lead times can be lumpy'],
    verdict: {
      good_for: ['Lifestyle + appreciation thesis', 'High-net-worth buyers with cushion'],
      not_ideal_for: ['Income-dependent investors', 'Thin reserve buyers'],
    },
    faq: [
      { q: 'Can luxury STR lose money monthly?', a: 'Yes — high revenue often pairs with high debt service and operating spend.' },
      { q: 'What do most investors get wrong?', a: 'They anchor on peak-week ADR instead of annual blended occupancy.' },
      { q: 'Should I still model Silvertip?', a: 'Yes — but run negative and break-even cases, not best-case only.' },
    ],
  },
  {
    slug: 'canmore-townhouse-str',
    title: 'Canmore Townhouse STR',
    monthly_revenue: 6100,
    monthly_costs: 5950,
    cash_flow: 150,
    payback_signal: 'break-even',
    definition:
      'Townhouse-style STR in Canmore often lands near break-even — roughly +$150/month in this scenario, with little room for error.',
    reality_check: ['Shared walls and HOA rules matter', 'Parking and hot tubs affect maintenance', 'Noise and bylaws can cap nights'],
    verdict: {
      good_for: ['Operators who self-manage', 'Buyers valuing space over condo tower'],
      not_ideal_for: ['Those needing large monthly distributions', 'Investors avoiding HOA politics'],
    },
    faq: [
      { q: 'Is break-even bad?', a: 'Not always — but it means small misses flip you negative; budget reserves accordingly.' },
      { q: 'Do townhouses outperform condos?', a: 'Sometimes on rate; fees and bylaws still decide net.' },
      { q: 'Where is the risk?', a: 'Special assessments and insurance step-ups in multi-unit communities.' },
    ],
  },
  {
    slug: 'harvie-heights-str',
    title: 'Harvie Heights STR',
    monthly_revenue: 5800,
    monthly_costs: 5200,
    cash_flow: 600,
    payback_signal: 'self-sustaining',
    definition:
      'Harvie Heights short-term product can reach about +$600/month when occupancy holds — a workable but not padded margin.',
    reality_check: ['Distance to core Canmore affects rate', 'Winter access and plowing matter', 'Guest expectations on amenities'],
    verdict: {
      good_for: ['Value buyers accepting location trade-offs', 'STR operators with pricing discipline'],
      not_ideal_for: ['Walk-to-downtown requirements at any cost', 'Zero time for operations'],
    },
    faq: [
      { q: 'Does Harvie Heights underperform downtown?', a: 'Often on nightly rate; some models still clear costs with lower purchase basis.' },
      { q: 'What drives occupancy here?', a: 'Price/value, ski-season length, and listing quality — not just views.' },
      { q: 'Is this scenario conservative?', a: 'It uses typical assumptions; your deal may differ.' },
    ],
  },
  {
    slug: 'three-sisters-village-condo',
    title: 'Three Sisters Village Condo',
    monthly_revenue: 5400,
    monthly_costs: 5350,
    cash_flow: 50,
    payback_signal: 'break-even',
    definition:
      'Three Sisters Village condos often sit on the edge — about +$50/month here, effectively break-even for decision purposes.',
    reality_check: ['Village amenities help marketing', 'Competition within the area is dense', 'Transit and ski access perceptions move bookings'],
    verdict: {
      good_for: ['Buyers who want village ecosystem', 'Balanced use + rent'],
      not_ideal_for: ['Those needing predictable large cash flow', 'Investors uncomfortable with razor-thin margin'],
    },
    faq: [
      { q: 'Why is Three Sisters often break-even?', a: 'Strong supply and competitive nightly rates cap net after fees.' },
      { q: 'What improves the outcome?', a: 'Higher occupancy or lower purchase price — usually one or both.' },
      { q: 'Compare to downtown?', a: 'See downtown condo analysis for a different location signal.' },
    ],
  },
  {
    slug: 'clearwater-canmore-1br',
    title: 'Clearwater Canmore 1BR',
    monthly_revenue: 4200,
    monthly_costs: 4600,
    cash_flow: -400,
    payback_signal: 'negative',
    definition:
      'This Clearwater-area 1BR scenario lands near -$400/month — common when purchase price and fees outpace STR gross.',
    reality_check: ['Building-specific fees dominate', '1BR rate caps in soft weeks', 'Management can erase thin spread'],
    verdict: {
      good_for: ['Long-horizon owners', 'Personal use heavy schedules'],
      not_ideal_for: ['Cash-flow-first underwriting', 'High LTV without reserves'],
    },
    faq: [
      { q: 'Can Clearwater still make sense?', a: 'As a lifestyle or appreciation bet — not always as monthly income.' },
      { q: 'What is the first lever to fix?', a: 'Usually purchase price or down payment; revenue levers are slower.' },
      { q: 'Should I trust one scenario?', a: 'No — cross-check with the calculator and another comparable analysis.' },
    ],
  },
  {
    slug: 'spring-creek-meadows-2br',
    title: 'Spring Creek Meadows 2BR',
    monthly_revenue: 8900,
    monthly_costs: 7800,
    cash_flow: 1100,
    payback_signal: 'self-sustaining',
    definition:
      'Spring Creek Meadows 2BR can reach about +$1,100/month when occupancy and rate align — a stronger operating profile in this model.',
    reality_check: ['Premium positioning must be maintained', 'Operating costs rise with finish level', 'Seasonality still applies'],
    verdict: {
      good_for: ['Investors seeking operating cushion', 'Buyers accepting premium basis'],
      not_ideal_for: ['Deep value hunters only', 'Those avoiding premium HOA environments'],
    },
    faq: [
      { q: 'Why is cash flow higher here?', a: 'Higher modeled gross relative to costs in this scenario — verify with real comps.' },
      { q: 'Is Spring Creek always better?', a: 'No — deal-specific; price and fees can flip the signal.' },
      { q: 'What should I validate?', a: 'Actual fees, rental bylaws, and trailing occupancy — not listing adjectives.' },
    ],
  },
  {
    slug: 'legacy-trail-1br',
    title: 'Legacy Trail 1BR',
    monthly_revenue: 3900,
    monthly_costs: 4500,
    cash_flow: -600,
    payback_signal: 'negative',
    definition:
      'Legacy Trail 1BR shows roughly -$600/month under these assumptions — negative carry unless revenue or basis improves.',
    reality_check: ['Commute expectations from guests vary', '1BR supply competes on price', 'Insurance and fees creep over time'],
    verdict: {
      good_for: ['Owners prioritizing housing + occasional rent', 'Buyers with renovation upside thesis'],
      not_ideal_for: ['Strict monthly income requirements', 'Maximum leverage without reserves'],
    },
    faq: [
      { q: 'Is negative carry always bad?', a: 'It is a warning sign for income investors; others accept it for non-cash goals.' },
      { q: 'What fixes negative carry fastest?', a: 'Lower mortgage payment, higher occupancy, or lower purchase price.' },
      { q: 'Read more on mistakes?', a: 'See the Canmore investment mistakes guide on this site.' },
    ],
  },
  {
    slug: 'mystic-springs-townhome',
    title: 'Mystic Springs Townhome',
    monthly_revenue: 6400,
    monthly_costs: 5900,
    cash_flow: 500,
    payback_signal: 'break-even',
    definition:
      'Mystic Springs townhome scenario lands around +$500/month — top of the break-even band, not yet “fat” self-sustaining in our thresholds.',
    reality_check: ['Pool and common amenities drive fees', 'Families book multi-night stays', 'Wear-and-tear on shared facilities'],
    verdict: {
      good_for: ['Family-oriented STR positioning', 'Operators who maintain units well'],
      not_ideal_for: ['Those who ignore HOA maintenance cycles', 'Investors needing >$500/mo cushion'],
    },
    faq: [
      { q: 'Is +$500/month safe?', a: 'It is thin — one slow month or fee jump can push you to break-even or negative.' },
      { q: 'What helps Mystic Springs performance?', a: 'Strong reviews, dynamic pricing, and tight turnover operations.' },
      { q: 'Townhome vs condo fees?', a: 'Compare reserve studies — townhomes are not automatically cheaper to operate.' },
    ],
  },
  {
    slug: 'pektin-crossing-2br',
    title: 'Pektin Crossing 2BR',
    monthly_revenue: 7200,
    monthly_costs: 7000,
    cash_flow: 200,
    payback_signal: 'break-even',
    definition:
      'Pektin Crossing 2BR sits near break-even at +$200/month — workable only with disciplined costs and occupancy.',
    reality_check: ['Location between nodes affects ADR', 'Parking rules impact guest satisfaction', 'Competing new supply over time'],
    verdict: {
      good_for: ['Patient operators', 'Buyers with modest cash-flow expectations'],
      not_ideal_for: ['Need for large distributions', 'Set-and-forget without management review'],
    },
    faq: [
      { q: 'Why is this only +$200?', a: 'Modeled costs and purchase structure absorb most gross — small changes swing the outcome.' },
      { q: 'Should I negotiate harder on price?', a: 'Often yes when margin is this thin; price is the cleanest lever.' },
      { q: 'Check occupancy assumptions where?', a: 'Use the occupancy guide and calculator on CanmoreROI.com.' },
    ],
  },
  {
    slug: 'canyon-ridge-townhouse',
    title: 'Canyon Ridge Townhouse',
    monthly_revenue: 7600,
    monthly_costs: 6400,
    cash_flow: 1200,
    payback_signal: 'self-sustaining',
    definition:
      'Canyon Ridge townhouse modeling shows about +$1,200/month — stronger net in this scenario due to gross vs fee balance.',
    reality_check: ['Snow and access maintenance', 'HOA enforcement on STR rules', 'Furniture and turnover quality'],
    verdict: {
      good_for: ['Investors seeking operating cushion', 'Hands-on or managed STR'],
      not_ideal_for: ['Buyers assuming passive income with zero oversight', 'Those ignoring bylaws'],
    },
    faq: [
      { q: 'Is +$1,200 typical for townhouses?', a: 'Not always — it depends on price, financing, and actual fees; this is one modeled case.' },
      { q: 'What could erode it?', a: 'Higher rates, fee spikes, or occupancy dips of even a few points.' },
      { q: 'Next step?', a: 'Compare to downtown and Solara analyses and run your own inputs in the calculator.' },
    ],
  },
  {
    slug: 'banff-trail-duplex-str',
    title: 'Banff Trail Duplex STR',
    monthly_revenue: 5400,
    monthly_costs: 5400,
    cash_flow: 0,
    payback_signal: 'break-even',
    definition:
      'Duplex STR near Banff Trail modeled at exact break-even — $0/month after simplified costs; reality rarely lands on zero, so treat as fragile.',
    reality_check: ['Shared utility and yard costs', 'Tenant/guest overlap with neighbors', 'Municipal rules on STR'],
    verdict: {
      good_for: ['Operators comfortable with duplex dynamics', 'Buyers valuing two-door flexibility'],
      not_ideal_for: ['Conflict-averse owners', 'Those needing positive cash day one'],
    },
    faq: [
      { q: 'Is $0/month realistic?', a: 'It is a modeling midpoint; most owners see small positive or negative swings.' },
      { q: 'Duplex-specific risk?', a: 'Neighbor relations and joint maintenance — costs are not always evenly predictable.' },
      { q: 'Where to read about break-even investing?', a: 'See the break-even scenario page under /scenarios/.' },
    ],
  },
];

pages.forEach(function (p) {
  const obj = {
    title: p.title,
    slug: p.slug,
    snapshot: {
      monthly_revenue: p.monthly_revenue,
      monthly_costs: p.monthly_costs,
      cash_flow: p.cash_flow,
    },
    payback_signal: p.payback_signal,
    definition: p.definition,
    reality_check: p.reality_check,
    verdict: p.verdict,
    faq: p.faq,
  };
  const file = path.join(DATA, p.slug + '.json');
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log('Wrote', p.slug + '.json');
});
