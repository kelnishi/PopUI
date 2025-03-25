/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
      "./src/renderer/index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
      "./components/**/*.{js,jsx,ts,tsx}", 
    // Exclude node_modules in all directories
      "!**/node_modules/**",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

