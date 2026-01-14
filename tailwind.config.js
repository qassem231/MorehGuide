/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-slate': '#1e293b',
        'brand-accent': '#3b82f6',
        'brand-light': '#64748b',
        'brand-cream': '#f1f5f9',
      },
      boxShadow: {
        'brand': '0 10px 30px rgba(59, 130, 246, 0.15)',
        'brand-lg': '0 20px 50px rgba(59, 130, 246, 0.2)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      },
    },
  },
  plugins: [],
}