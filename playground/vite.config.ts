import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  base: '/Zebra/',
  assetsInclude: ['ze'],
  resolve: {
    alias: {
      'react': resolve('./node_modules/react'),
    }
  }
})
