/* ----
# Quote Box Filter
# By: Whatasiger
# 将带 [!XXX] 前缀的 <blockquote> 改写为 .quote-box 结构。
# 支持 Typora / GFM 风格的 Alert 语法：
#   > [!QUOTE]       --> 引用（灰，可自定义标题）
#   > [!IMPORTANT]   --> 作者注（蓝）
#   > [!NOTE]        --> 提醒（黄）
#   > [!WARNING]     --> 警告（红）
#   > [!TIP]         --> 提示（绿）
#   > [!CAUTION]     --> 注意（深红）
# 普通引用 (> 直接写内容，不带 [!XXX]) 保留原生 <blockquote>，仅左边框，不加顶栏。
# 自定义标题：> [!XXX] 自定义标题   （任何类型都支持）
---- */

'use strict';

// 类型 -> 类名 / 默认表头 / Font Awesome 4.7 图标
var TYPE_MAP = {
    QUOTE:     { className: 'quote-default',   title: '引用',  icon: 'fa-quote-left' },
    IMPORTANT: { className: 'quote-important', title: '作者注', icon: 'fa-pencil' },
    NOTE:      { className: 'quote-note',      title: '提醒',  icon: 'fa-info-circle' },
    WARNING:   { className: 'quote-warning',   title: '警告',  icon: 'fa-exclamation-triangle' },
    TIP:       { className: 'quote-tip',       title: '提示',  icon: 'fa-lightbulb-o' },
    CAUTION:   { className: 'quote-caution',   title: '注意',  icon: 'fa-exclamation-circle' }
};
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildBox(type, customTitle, body) {
    var title = customTitle ? escapeHtml(customTitle) : type.title;
    return (
        '<div class="quote-box ' + type.className + '">' +
            '<div class="quote-header">' +
                '<i class="quote-icon fa ' + type.icon + '" aria-hidden="true"></i>' +
                '<span class="quote-title">' + title + '</span>' +
                '<button class="quote-toggle" type="button" aria-label="折叠/展开">' +
                    '<i class="fa fa-chevron-down" aria-hidden="true"></i>' +
                '</button>' +
            '</div>' +
            '<div class="quote-body">' + body + '</div>' +
        '</div>'
    );
}

// 把单个 <blockquote> 内容转换为对应的 .quote-box HTML
function transformOne(inner) {
    // 优先匹配首段 <p>...</p>
    var firstPMatch = inner.match(/^\s*<p>([\s\S]*?)<\/p>([\s\S]*)$/);

    if (firstPMatch) {
        var firstP = firstPMatch[1];
        var rest = firstPMatch[2];

        // [!TYPE]    或   [!TYPE] 自定义标题   或   [!TYPE]\n剩余内容
        var alertMatch = firstP.match(/^\s*\[!([A-Z]+)\][ \t]*([^\n]*)(?:\n([\s\S]*))?$/);

        if (alertMatch && TYPE_MAP[alertMatch[1]]) {
            var type = TYPE_MAP[alertMatch[1]];
            var customTitle = (alertMatch[2] || '').trim();
            var sameLineRest = (alertMatch[3] || '').trim();

            var bodyContent = '';
            // 同段内换行后的剩余文本仍属于第一段，需保留为段落
            if (sameLineRest) {
                bodyContent += '<p>' + sameLineRest + '</p>';
            }
            bodyContent += rest;

            return buildBox(type, customTitle, bodyContent);
        }
    }

    // 不匹配 alert 语法：保留原始 <blockquote>，仅显示左边框，不加顶栏
    return '<blockquote>' + inner + '</blockquote>';
}

// 从最内层向外迭代替换，避免嵌套 blockquote 导致的正则匹配跨界。
// 内层 <blockquote> 会先被替换为 <div class="quote-box">，
// 之后外层即可被同一正则匹配。
function transformBlockquotes(html) {
    if (!html || html.indexOf('<blockquote>') === -1) {
        return html;
    }
    // 仅匹配「内部不再含 <blockquote>」的最内层引用
    var reInner = /<blockquote>((?:(?!<blockquote>)[\s\S])*?)<\/blockquote>/g;

    var prev;
    var current = html;
    var safety = 0;
    do {
        prev = current;
        current = current.replace(reInner, function (_, inner) {
            return transformOne(inner);
        });
        safety++;
    } while (prev !== current && safety < 20);

    return current;
}

hexo.extend.filter.register('after_render:html', function (htmlContent) {
    return transformBlockquotes(htmlContent);
});
