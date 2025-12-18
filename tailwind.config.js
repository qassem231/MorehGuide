/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#213448',
        'brand-slate': '#547792',
        'brand-accent': '#94B4C1',
        'brand-cream': '#EAE0CF',
      },
    },
  },
  plugins: [],
}