'use strict';

/**
 * Authoritative Indian Central Pollution Control Board (CPCB) AQI Knowledge Base.
 * Sourced directly from MoEFCC & CPCB national standards.
 */

const CPCB_REFERENCE_TEXT = `
## Understanding India’s Air Quality Index (AQI)

### What is the Air Quality Index (AQI)?
The Air Quality Index (AQI) is a daily reporting tool used to communicate how clean or polluted the outdoor air is and what associated health effects might be a concern for you. Instead of presenting complex scientific measurements, the AQI translates air pollution data into a single, easy-to-understand number on a scale from 0 to 500, paired with a descriptive category and color code. The higher the AQI value, the greater the level of air pollution and the higher the health risk.

### What is the CPCB?
The Central Pollution Control Board (CPCB) is India’s apex statutory organization under the Ministry of Environment, Forest and Climate Change (MoEFCC). Established in 1974, the CPCB monitors environmental standards across the country and operates the National Air Quality Monitoring Programme (NAMP). Under the Swachh Bharat Abhiyan, the CPCB launched the National Air Quality Index with the motto "One Number – One Colour – One Description" to help citizens easily assess air quality in their neighborhoods.

### How Does CPCB Calculate AQI?
The CPCB calculates the AQI using real-time and averaged concentration data from 8 major air pollutants. To generate an official AQI reading for a monitoring station, data must be available for at least three pollutants, one of which must be either PM10 or PM2.5.

1. Averaging Periods: Concentrations are measured over a 24-hour rolling average for most pollutants, while Carbon Monoxide (CO) and Ozone (O3) are measured over an 8-hour rolling average.
2. Sub-Index Calculation: Each monitored pollutant is converted into an individual score called a sub-index based on CPCB’s standardized health breakpoint concentrations.
3. Final AQI Score: The overall AQI reported for a location is the highest (worst) sub-index value among all measured pollutants. The specific pollutant responsible for that highest score is identified as the Prominent Pollutant.

### Key Air Pollutants Monitored by CPCB
* Particulate Matter 10 (PM10): Inhalable airborne particles with diameters of 10 micrometers or smaller, originating from road dust, construction sites, and industrial crushing. They irritate the eyes, nose, and upper respiratory tract.
* Fine Particulate Matter 2.5 (PM2.5): Microscopic particles 2.5 micrometers or smaller—about 30 times thinner than a human hair—emitted from vehicle exhaust, power plants, and waste burning. Because of their tiny size, they penetrate deep into the lungs and enter the bloodstream.
* Nitrogen Dioxide (NO2): A reddish-brown toxic gas primarily produced by burning fossil fuels in vehicles and power plants. It inflames the lining of the lungs and reduces immunity to respiratory infections.
* Sulphur Dioxide (SO2): A sharp-smelling colorless gas released when burning coal and oil in power stations and industrial facilities. It causes airway constriction, particularly in people with asthma.
* Carbon Monoxide (CO): A colorless, odorless gas formed by the incomplete combustion of fuels in engines and stoves. It reduces the amount of oxygen carried in the bloodstream to vital organs like the heart and brain.
* Ground-Level Ozone (O3): A secondary pollutant formed when sunlight reacts with nitrogen oxides and volatile organic compounds from vehicles and industry. Unlike upper-atmosphere ozone, ground-level ozone triggers chest pain, coughing, and throat irritation.
* Ammonia (NH3): A pungent gas emitted largely from agricultural fertilizers, livestock waste, and certain industrial processes. High levels irritate the eyes, skin, and respiratory tract, and react with other gases to form secondary particulate matter.
* Lead (Pb): A toxic heavy metal released from metal processing, battery manufacturing, and industrial emissions. Prolonged exposure accumulates in the body and harms the nervous system, kidneys, and cardiovascular health.

### CPCB AQI Categories, Color Codes & Health Guidelines

| AQI Range | Category | Color Code | Hex Code | Health Impacts & Guidelines |
|---|---|---|---|---|
| 0 – 50 | Good | Deep Green | #00B050 | Impact: Minimal health impact. Guideline: Air quality is ideal; enjoy normal outdoor activities. Perfect air quality for outdoor workouts, jogging, and cycling. Open windows and ventilate indoor spaces naturally. No special precautions needed for sensitive groups. |
| 51 – 100 | Satisfactory | Light Green | #92D050 | Impact: Minor breathing discomfort to sensitive people. Guideline: Safe for the general public; individuals with severe asthma should monitor symptoms. Safe for general outdoor exercise and leisure activities. Individuals with severe asthma or chronic bronchitis should keep rescue inhalers handy. Good conditions for general outdoor gatherings. |
| 101 – 200 | Moderate | Yellow | #FFFF00 | Impact: Breathing discomfort to people with lung or heart disease, children, and older adults. Guideline: Sensitive groups should reduce prolonged or heavy outdoor exertion. Children, seniors, and heart/lung patients should reduce strenuous outdoor workouts. Consider exercising outdoors earlier in the morning or indoors. Keep windows closed during peak traffic and construction hours. |
| 201 – 300 | Poor | Orange | #FF9900 | Impact: Breathing discomfort to most people on prolonged exposure; noticeable strain on heart and lung patients. Guideline: Avoid extended outdoor exertion; wear a well-fitted N95 mask if stepping out for long periods. Avoid long runs, high-intensity outdoor activities, or heavy manual labor outside. Wear a well-fitted N95 or FFP2 respirator when commuting or stepping outdoors. Sensitive groups should stay indoors in clean air spaces. |
| 301 – 400 | Very Poor | Red | #FF0000 | Impact: Triggers respiratory illness on prolonged exposure; severely affects people with existing heart or lung conditions. Guideline: Limit outdoor physical activity; keep windows closed and run indoor air purifiers if available. Limit or suspend all non-essential outdoor physical activity. Keep residential and office doors and windows tightly closed. Operate indoor HEPA air purifiers continuously. Vulnerable individuals must stay strictly indoors and consult a doctor if breathing issues occur. |
| 401 – 500 | Severe | Maroon | #C00000 | Impact: Affects healthy people and seriously impacts those with existing diseases. Guideline: Avoid all outdoor physical exertion; vulnerable groups should remain strictly indoors. Emergency health hazard: Avoid all outdoor physical exertion for all age groups. Stay strictly indoors with sealed windows and maximum air purification. Anyone experiencing chest tightness, wheezing, or dizziness should seek medical advice promptly. Schools and offices in high-risk zones may implement work/study from home protocols. |
`;

const CPCB_CATEGORIES = [
  {
    range: [0, 50],
    category: 'Good',
    color: 'Deep Green',
    hex: '#00B050',
    impact: 'Minimal health impact. Air quality is ideal.',
    activityGuidance: 'Ideal for all outdoor activities including cycling, running, and workouts. Open windows.',
  },
  {
    range: [51, 100],
    category: 'Satisfactory',
    color: 'Light Green',
    hex: '#92D050',
    impact: 'Minor breathing discomfort to sensitive individuals.',
    activityGuidance: 'Safe for general outdoor exercise and cycling. People with severe asthma should keep inhalers handy.',
  },
  {
    range: [101, 200],
    category: 'Moderate',
    color: 'Yellow',
    hex: '#FFFF00',
    impact: 'Breathing discomfort to people with lung/heart disease, children, and older adults.',
    activityGuidance: 'Sensitive groups should reduce heavy outdoor exertion like strenuous cycling. General public can continue with caution.',
  },
  {
    range: [201, 300],
    category: 'Poor',
    color: 'Orange',
    hex: '#FF9900',
    impact: 'Breathing discomfort to most people on prolonged exposure.',
    activityGuidance: 'Avoid extended outdoor exertion or cycling. Wear an N95 mask if going outside.',
  },
  {
    range: [301, 400],
    category: 'Very Poor',
    color: 'Red',
    hex: '#FF0000',
    impact: 'Triggers respiratory illness on prolonged exposure; severely affects heart/lung patients.',
    activityGuidance: 'Limit outdoor physical activity; do not go for cycling or outdoor workouts. Keep windows closed and run HEPA air purifiers.',
  },
  {
    range: [401, 500],
    category: 'Severe',
    color: 'Maroon',
    hex: '#C00000',
    impact: 'Emergency health hazard affecting healthy people and severely impacting diseased groups.',
    activityGuidance: 'Avoid all outdoor physical exertion. Stay strictly indoors with sealed windows and air purifiers.',
  },
];

function getCategoryForAqi(aqi) {
  if (aqi == null || isNaN(aqi)) return null;
  const num = Math.round(Number(aqi));
  return (
    CPCB_CATEGORIES.find((cat) => num >= cat.range[0] && num <= cat.range[1]) ||
    (num > 500 ? CPCB_CATEGORIES[CPCB_CATEGORIES.length - 1] : CPCB_CATEGORIES[0])
  );
}

module.exports = {
  CPCB_REFERENCE_TEXT,
  CPCB_CATEGORIES,
  getCategoryForAqi,
};
