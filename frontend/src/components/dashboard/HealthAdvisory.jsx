/**
 * Health Advisory component for Dashboard.
 * Displays standardized health advisory text corresponding to the AQI category.
 *
 * Props:
 *   aqi      — AQI array from current conditions or AQI number
 *   category — optional category string (e.g. 'Good', 'Moderate', etc.)
 *   title    — section heading (defaults to 'Health Advisory')
 */

const HEALTH_ADVISORIES = {
  GOOD: 'Air quality is ideal, with minimal health risks for everyone. Enjoy your day and continue your normal outdoor activities without concern. This is an excellent time for jogging, cycling, outdoor workouts, and recreational activities. You can also naturally ventilate your indoor spaces by opening windows. No special precautions are necessary, even for sensitive individuals.',

  SATISFACTORY: 'Air quality is generally safe for the public, although unusually sensitive individuals may experience minor breathing discomfort. Most people can comfortably enjoy outdoor activities, exercise, and social gatherings without restrictions. Individuals with severe asthma or chronic respiratory conditions should remain mindful of their symptoms and keep prescribed rescue medication readily available. Overall, normal daily activities can continue with minimal precautions.',

  MODERATE: 'Air quality may cause breathing discomfort among children, older adults, and individuals with existing heart or lung conditions, particularly during prolonged exposure. These sensitive groups should avoid strenuous outdoor exercise and consider shifting physical activities indoors or to periods with better air quality. The general public can continue routine activities but should remain attentive to any respiratory discomfort. Keeping windows closed during peak traffic and construction hours can also help reduce indoor exposure.',

  POOR: 'Prolonged exposure to the current air quality may cause breathing difficulties even in otherwise healthy individuals, while people with existing heart or lung conditions may experience more significant discomfort. Avoid extended outdoor activities, intense workouts, running, and strenuous physical labour. If going outside is unavoidable, wear a well-fitted N95 or FFP2 respirator to reduce exposure to harmful particles. Sensitive individuals should stay indoors in spaces with cleaner air and avoid unnecessary outdoor travel.',

  VERY_POOR: 'Air pollution has reached a level that can trigger respiratory illnesses, especially with prolonged exposure, and poses serious risks to individuals with existing heart or lung conditions. Restrict outdoor physical activities as much as possible, and vulnerable individuals should remain indoors in clean-air environments. Keep doors and windows closed to minimize polluted air entering your surroundings, and operate HEPA air purifiers continuously if available. Anyone experiencing breathing difficulties should seek medical advice promptly.',

  SEVERE: 'Air quality has reached a hazardous level that can seriously affect even healthy individuals and pose extreme risks to people with pre-existing respiratory or cardiovascular conditions. Avoid all outdoor physical exertion and remain indoors with windows and doors closed to minimize exposure. Use effective indoor air purification wherever possible and avoid unnecessary travel. Anyone experiencing chest tightness, wheezing, dizziness, or breathing difficulties should seek medical attention promptly. Schools and workplaces in severely affected areas should consider implementing remote learning or work-from-home arrangements to protect public health.',
};

/**
 * Resolves the corresponding category paragraph based on AQI array, category string,
 * or numerical AQI value.
 */
function getAdvisoryParagraph(aqi, category) {
  let cat = typeof category === 'string' ? category : '';
  let aqiVal = typeof aqi === 'number' ? aqi : null;

  if (Array.isArray(aqi)) {
    const cpcb = aqi.find((a) => a.code === 'ind_cpcb');
    const uaqi = aqi.find((a) => a.code === 'uaqi');
    const primary = cpcb || uaqi || aqi[0];
    if (primary) {
      if (!cat && primary.category) cat = primary.category;
      if (aqiVal == null && typeof primary.aqi === 'number') aqiVal = primary.aqi;
      else if (aqiVal == null && primary.aqiDisplay && !isNaN(Number(primary.aqiDisplay))) {
        aqiVal = Number(primary.aqiDisplay);
      }
    }
  } else if (aqi && typeof aqi === 'object') {
    if (!cat && aqi.category) cat = aqi.category;
    if (aqiVal == null && typeof aqi.aqi === 'number') aqiVal = aqi.aqi;
    else if (aqiVal == null && aqi.aqiDisplay && !isNaN(Number(aqi.aqiDisplay))) {
      aqiVal = Number(aqi.aqiDisplay);
    }
  } else if (typeof aqi === 'string' && !isNaN(Number(aqi))) {
    aqiVal = Number(aqi);
  }

  const norm = cat.trim().toLowerCase().replace(/[-_]/g, ' ');

  // Match category text
  if (norm.includes('good')) return HEALTH_ADVISORIES.GOOD;
  if (norm.includes('satisfactory')) return HEALTH_ADVISORIES.SATISFACTORY;
  if (norm.includes('moderate')) return HEALTH_ADVISORIES.MODERATE;
  if (norm.includes('very poor')) return HEALTH_ADVISORIES.VERY_POOR;
  if (norm.includes('poor')) return HEALTH_ADVISORIES.POOR;
  if (norm.includes('severe')) return HEALTH_ADVISORIES.SEVERE;

  // Match by AQI numeric scale
  if (aqiVal != null && !isNaN(aqiVal)) {
    if (aqiVal <= 50) return HEALTH_ADVISORIES.GOOD;
    if (aqiVal <= 100) return HEALTH_ADVISORIES.SATISFACTORY;
    if (aqiVal <= 200) return HEALTH_ADVISORIES.MODERATE;
    if (aqiVal <= 300) return HEALTH_ADVISORIES.POOR;
    if (aqiVal <= 400) return HEALTH_ADVISORIES.VERY_POOR;
    return HEALTH_ADVISORIES.SEVERE;
  }

  return null;
}

export default function HealthAdvisory({ aqi, category, title = 'Health Advisory' }) {
  const paragraph = getAdvisoryParagraph(aqi, category);

  if (!paragraph) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <p className="text-sm text-gray-700 leading-relaxed">
        {paragraph}
      </p>
    </section>
  );
}
