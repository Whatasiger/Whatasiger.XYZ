/* ----
# Hide From Index Generator
# By: Whatasiger
# 覆盖默认的 index 生成器，过滤掉 Front Matter 中含 hideIndex: true 的文章。
# 这些文章在首页和分页中不显示，但标签页、归档页、直链访问均不受影响。
---- */

'use strict';

const pagination = require('hexo-pagination');

hexo.extend.generator.register('index', function(locals) {
  const config = this.config;

  const posts = locals.posts
    .filter(post => !post.hideIndex)
    .sort(config.index_generator.order_by);

  posts.data.sort((a, b) => (b.sticky || 0) - (a.sticky || 0));

  const paginationDir = config.index_generator.pagination_dir
    || config.pagination_dir
    || 'page';
  const path = config.index_generator.path || '';

  return pagination(path, posts, {
    perPage: config.index_generator.per_page,
    layout: config.index_generator.layout || ['index', 'archive'],
    format: paginationDir + '/%d/',
    data: {
      __index: true
    }
  });
});
