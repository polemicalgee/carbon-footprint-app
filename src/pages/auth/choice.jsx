import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserRound } from 'lucide-react';

const accountOptions = [
  {
    type: 'individual',
    title: 'Individual',
    description: 'Track personal travel and everyday emissions.',
    icon: UserRound,
  },
  {
    type: 'organisation',
    title: 'Organisation',
    description: 'Monitor facility energy use and organisational emissions.',
    icon: Building2,
  },
];

const AuthChoice = () => {
  const navigate = useNavigate();

  const goToAuth = (path, type) => navigate(`/${path}?type=${type}`);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 px-5 py-12 flex items-center justify-center">
      <section className="w-full max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#00a650]">CarbonWise.</h1>
          <p className="mt-3 text-gray-600">Choose the account that fits how you track emissions.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {accountOptions.map(({ type, title, description, icon }) => (
            <article key={type} className="bg-white border border-gray-200 rounded-xl p-7 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50 text-[#00a650]">
                  {React.createElement(icon, { size: 24 })}
                </span>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              </div>
              <p className="text-sm text-gray-600 min-h-10">{description}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => goToAuth('register', type)}
                  className="px-4 py-2.5 bg-[#00a650] text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => goToAuth('login', type)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Log in
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AuthChoice;