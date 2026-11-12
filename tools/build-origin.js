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
    delete hexo.extend.generator.store.search_json;    // Glint 的站内搜索索引：Origin 用 search.xml，不需要它
    delete hexo.extend.generator.store.todo_json;      // 首页周榜的 /todo.json：Origin 只用构建时的数据
    return hexo.call('generate', { force: true });  // 强制全量写出：hexo server 会把源文件新哈希写进缓存，之后不带 force 的 generate 以为没变、留着 public 里的旧文件
  })
  .then(() => hexo.exit())
  .catch(err => hexo.exit(err).then(() => process.exit(1)));
