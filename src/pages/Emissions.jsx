import React from 'react';
import { Leaf, Zap, Globe, Info } from 'lucide-react';

const scopes = [
  {
    number: 1,
    title: 'Scope 1 — Direct Emissions',
    icon: Leaf,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Direct GHG emissions from sources owned or controlled by your organization.',
    examples: ['Company vehicles', 'On-site fuel combustion', 'Industrial processes', 'Refrigerant leaks'],
    where: 'Tracked in: Vehicle & Location pages'
  },
  {
    number: 2,
    title: 'Scope 2 — Indirect Energy Emissions',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Indirect emissions from the generation of purchased electricity, steam, heat, or cooling.',
    examples: ['Purchased electricity from the grid', 'District heating', 'Purchased steam', 'Cooling systems'],
    where: 'Tracked in: Industrial page'
  },
  {
    number: 3,
    title: 'Scope 3 — Value Chain Emissions',
    icon: Globe,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    description: 'All other indirect emissions that occur in a company\'s value chain, both upstream and downstream.',
    examples: ['Business travel', 'Supply chain logistics', 'Employee commuting', 'Product lifecycle'],
    where: 'Tracked across: All emission categories'
  }
];

const Emissions = () => (
  <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Emissions</h1>
      <p className="text-gray-500 mt-1">Understanding GHG Protocol scopes and how CarbonWise tracks them.</p>
    </div>

    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-8 flex items-start gap-3 shadow-sm">
      <Info className="text-[#00a650] flex-shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-semibold text-gray-800 text-sm">GHG Protocol Standard</p>
        <p className="text-gray-500 text-sm mt-0.5">
          CarbonWise follows the Greenhouse Gas Protocol — the world's most widely used standard for measuring and managing greenhouse gas emissions. All your logged activities are automatically categorised into the three scopes below and visible on your Reports page.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {scopes.map(({ number, title, icon: Icon, color, bg, border, description, examples, where }) => (
        <div key={number} className={`bg-white rounded-2xl border ${border} p-6 shadow-sm`}>
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-4`}>
            <Icon className={color} size={24} />
          </div>
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${bg} ${color}`}>Scope {number}</span>
          <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
          <p className="text-gray-500 text-sm mb-4">{description}</p>
          <div className="space-y-1 mb-4">
            {examples.map(ex => (
              <div key={ex} className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`}></span>
                {ex}
              </div>
            ))}
          </div>
          <p className={`text-xs font-semibold ${color}`}>{where}</p>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Emission Factors Used by CarbonWise</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
              <th className="py-3 text-left font-semibold">Source</th>
              <th className="py-3 text-left font-semibold">Category</th>
              <th className="py-3 text-left font-semibold">Scope</th>
              <th className="py-3 text-right font-semibold">Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { source: 'Petrol Car', cat: 'Vehicle', scope: 1, factor: '192 g CO₂/km' },
              { source: 'Diesel Car', cat: 'Vehicle', scope: 1, factor: '232 g CO₂/km' },
              { source: 'Hybrid Car', cat: 'Vehicle', scope: 1, factor: '109 g CO₂/km' },
              { source: 'Electric Car', cat: 'Vehicle', scope: 1, factor: '47 g CO₂/km' },
              { source: 'Grid Electricity (average)', cat: 'Industrial', scope: 2, factor: '0.45 kg CO₂/kWh' },
              { source: 'Coal Power', cat: 'Industrial', scope: 2, factor: '1.00 kg CO₂/kWh' },
              { source: 'Natural Gas', cat: 'Industrial', scope: 2, factor: '0.40 kg CO₂/kWh' },
              { source: 'Renewable Energy', cat: 'Industrial', scope: 2, factor: '0.00 kg CO₂/kWh' },
            ].map(({ source, cat, scope, factor }) => (
              <tr key={source} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-800">{source}</td>
                <td className="py-3 text-gray-500">{cat}</td>
                <td className="py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    scope === 1 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>Scope {scope}</span>
                </td>
                <td className="py-3 text-right font-mono text-gray-700">{factor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-4">Sources: IPCC, UK DEFRA, US EPA emission factor databases. Vehicle AI predictions override static factors when engine data is provided.</p>
    </div>
  </div>
);

export default Emissions;
