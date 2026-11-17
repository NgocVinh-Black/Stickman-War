// Trang admin build bằng Rspack. Dev: http://localhost:5174 (proxy /api -> NestJS :8787).
// Build ra apps/admin/dist, deploy dưới https://zone-c.io.vn/stickman-war/admin/ (đường dẫn tương đối).
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { VueLoaderPlugin } from 'vue-loader';

const dev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  context: import.meta.dirname,
  entry: { main: './src/main.ts' },
  output: {
    path: `${import.meta.dirname}/dist`,
    publicPath: 'auto',
    filename: dev ? '[name].js' : 'assets/[name].[contenthash:8].js',
    cssFilename: 'assets/[name].[contenthash:8].css',
    clean: true,
  },
  resolve: { extensions: ['.ts', '.js', '.vue', '.json'] },
  module: {
    rules: [
      { test: /\.vue$/, loader: 'vue-loader', options: { experimentalInlineMatchResource: true } },
      {
        test: /\.ts$/,
        loader: 'builtin:swc-loader',
        options: { jsc: { parser: { syntax: 'typescript' }, target: 'es2022' } },
        type: 'javascript/auto',
      },
      { test: /\.css$/, type: 'css/auto' },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html', favicon: '../web/public/icon.svg' }),
    new rspack.DefinePlugin({
      __VUE_OPTIONS_API__: 'false',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    }),
  ],
  devtool: dev ? 'cheap-module-source-map' : false,
  devServer: {
    port: 5174,
    host: '127.0.0.1',
    historyApiFallback: true,
    proxy: [{ context: ['/api'], target: 'http://127.0.0.1:8787' }],
  },
});
