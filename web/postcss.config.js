// Tailwind v4 uses a new PostCSS plugin package
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwind(),
    autoprefixer(),
  ],
};