/* ----
# Build Origin
# 生成「Origin」界面：同一份内容（source/）配上 themes/origin，输出到 public/origin/，站点根路径为 /origin/
#   node tools/build-origin.js          （npm run build 会在 hexo generate 之后自动调用）
# - 配置：_config.yml + _config.build-origin.yml
# - 缓存：单独放在 .origin-build/db.json，不与 Glint 的 db.json 混用（根路径不同，渲染缓存不能共享）
# - CARRiER WAVE. 只有 Glint 根路径下的那一份，与界面主题无关，这里不生成
---- */

'use strict';

const path = require('path');
const Hexo = require('hexo');

const base = path.resolve(__dirname, '..');
const hexo = new Hexo(base, {
  config: '_config.yml,_config.build-origin.yml',
  output: path.join(base, '.origin-build'),
  silent: false
});

hexo.init()
  .then(() => {
    delete hexo.extend.generator.store.carrier_wave;
    return hexo.call('generate', {});
  })
  .then(() => hexo.exit())
  .catch(err => hexo.exit(err).then(() => process.exit(1)));
