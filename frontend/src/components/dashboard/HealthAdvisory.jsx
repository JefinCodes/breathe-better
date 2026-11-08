import { Users, User, Wind, Heart, Activity, Baby } from 'lucide-react';

/**
 * Maps recommendation object keys to display metadata.
 * Only keys explicitly listed here are rendered; unknown keys are ignored.
 */
const GROUPS = [
  { key: 'generalPopulation',    label: 'General Population',  Icon: Users },
  { key: 'elderly',              label: 'Elderly',             Icon: User },
  { key: 'children',             label: 'Children',            Icon: Baby },
  { key: 'athletes',             label: 'Athletes',            Icon: Activity },
  { key: 'pregnantWomen',        label: 'Pregnant Women',      Icon: Heart },
  { key: 'lungDiseasePopulation',  label: 'Lung Conditions',   Icon: Wind },
  { key: 'heartDiseasePopulation', label: 'Heart Conditions',  Icon: Heart },
];

/**
 * Displays health and safety recommendations returned by the Google API.
 * Only renders recommendations that are actually present (non-null/non-empty).
 * Does NOT invent or rewrite any recommendation text.
 *
 * Props:
 *   recommendations — object { generalPopulation, elderly, … } | null
 *   title           — optional section heading (default "Health Advisory")
 */
export default function HealthAdvisory({ recommendations, title = 'Health Advisory' }) {
  if (!recommendations) return null;

  const available = GROUPS.filter(
    (g) => recommendations[g.key] && recommendations[g.key].trim().length > 0
  );

  if (available.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        {title}
      </h3>

      <div className="space-y-3">
        {available.map(({ key, label, Icon }) => (
          <div
            key={key}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
          >
            <div className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-0.5">{label}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {recommendations[key]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
