/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       fontFamily: {
        // UI defaults
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        roboto: ['Roboto', 'sans-serif'],
        opensans: ['Open Sans', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        worksans: ['Work Sans', 'sans-serif'],

        // Tech / Dev
        grotesk: ['Space Grotesk', 'sans-serif'],
        ibm: ['IBM Plex Sans', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],

        // Stylish UI
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],

        // Serif / editorial
        playfair: ['Playfair Display', 'serif'],
        lora: ['Lora', 'serif'],
        merriweather: ['Merriweather', 'serif'],
      },
    }
  },
  plugins: [],
}