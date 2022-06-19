export default {
  npmClient: "pnpm",
  tailwindcss: {},
  plugins: ["@umijs/plugins/dist/tailwindcss"],
  apiRoute: {
    platform: 'vercel'
  },
  routes: [
    {
      exact: true, path: '/', component: 'index',
      wrappers: [
        '@/wrappers/auth',
      ],
    },
    { exact: true, path: '/login', component: 'login' },
  ],
  chainWebpack(memo, { env, webpack }) {
    memo.mode('development')
  },
};
