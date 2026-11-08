import CityAutocomplete from './components/CityAutocomplete';

function App() {
  function handleCitySelect(city) {
    if (city) {
      console.log('Selected city:', city);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Breathe Better</h1>
        <p className="text-sm text-gray-500 mb-6">Search for an Indian city to check air quality.</p>
        <CityAutocomplete
          onCitySelect={handleCitySelect}
          placeholder="Search for a city in India..."
          label="City"
        />
      </div>
    </div>
  );
}

export default App;
