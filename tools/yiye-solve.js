/**
 * 一叶（source/gizmo/yiye/）关卡求解器：用 sim.js 的同一套物理做束搜索，检验每关可解，并给出最少涟漪数参考 par
 *
 *   node tools/yiye-solve.js          全部关卡
 *   node tools/yiye-solve.js 3 7      只解第 3、7 关（从 1 数）
 *
 * 只模拟「等叶子停稳再点下一下」的保守打法（玩家边漂边点往往更省），所以求出的步数是上界。
 * 输出两项：只求抵达的最少涟漪；拾齐全部萤火再抵达的最少涟漪。par 一般取前者，或前者 + 1。
 */
"use strict";
var S = require("../source/gizmo/yiye/sim.js");
var W = S.W, H = S.H, P = S.P;

var CELL = 10, GW = Math.ceil(W / CELL) + 1, GH = Math.ceil(H / CELL) + 1;

// 网格上的绕行距离场（避开石头、荷叶、漩涡），作为搜索的估价
function field(lv, tx, ty) {
    var cost = new Float64Array(GW * GH), dist = new Float64Array(GW * GH).fill(Infinity);
    for (var j = 0; j < GH; j++) for (var i = 0; i < GW; i++) {
        var x = i * CELL, y = j * CELL, c = 1;
        (lv.rocks || []).concat(lv.pads || []).forEach(function (o) {
            if (Math.hypot(x - o[0], y - o[1]) < o[2] + P.leafR) c = Infinity;
        });
        (lv.pools || []).forEach(function (o) {
            var d = Math.hypot(x - o[0], y - o[1]);
            if (d < o[2] * 0.45) c = Infinity; else if (d < o[2]) c = Math.max(c, 4);
        });
        cost[j * GW + i] = c;
    }
    var gi = Math.round(tx / CELL), gj = Math.round(ty / CELL);
    var heap = [[0, gj * GW + gi]];
    dist[gj * GW + gi] = 0;
    var nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (heap.length) {
        var best = 0;
        for (var k = 1; k < heap.length; k++) if (heap[k][0] < heap[best][0]) best = k;
        var cur = heap[best]; heap[best] = heap[heap.length - 1]; heap.pop();
        if (cur[0] > dist[cur[1]]) continue;
        var ci = cur[1] % GW, cj = (cur[1] - ci) / GW;
        nb.forEach(function (n) {
            var ni = ci + n[0], nj = cj + n[1];
            if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) return;
            var id = nj * GW + ni, c = cost[id];
            if (c === Infinity) return;
            var nd = cur[0] + n[2] * CELL * c;
            if (nd < dist[id]) { dist[id] = nd; heap.push([nd, id]); }
        });
    }
    return function (x, y) {
        var i = Math.max(0, Math.min(GW - 1, Math.round(x / CELL))), j = Math.max(0, Math.min(GH - 1, Math.round(y / CELL)));
        var d = dist[j * GW + i];
        return d === Infinity ? 1e5 : d;
    };
}

function clone(g) {
    var n = new S.Game(g.lv);
    n.x = g.x; n.y = g.y; n.vx = g.vx; n.vy = g.vy; n.th = g.th; n.w = g.w; n.t = g.t;
    n.used = g.used; n.got = g.got.slice(); n.state = g.state;
    n.ripples = g.ripples.map(function (r) { return Object.assign({}, r); });
    return n;
}

function run(g) {
    var t0 = g.t;
    do { g.step(); } while (!(g.t - t0 > 0.3 && g.settled()) && g.t - t0 < 4 && g.state === "play");
}

function solve(lv, needMotes) {
    var goalF = field(lv, lv.goal[0], lv.goal[1]);
    var moteF = (lv.motes || []).map(function (m) { return field(lv, m[0], m[1]); });
    function score(g) {
        if (g.state === "won") return (needMotes && !g.gotAll()) ? 1e6 : -1;
        if (g.state === "sunk") return 1e7;
        if (!needMotes) return goalF(g.x, g.y);
        var left = 0, near = Infinity;
        g.got.forEach(function (got, i) { if (!got) { left++; near = Math.min(near, moteF[i](g.x, g.y)); } });
        return left ? near + left * 900 : goalF(g.x, g.y);
    }
    var beam = [new S.Game(lv)];
    for (var depth = 1; depth <= 12; depth++) {
        var next = [];
        beam.forEach(function (g) {
            for (var a = 0; a < 32; a++) {
                var ang = a / 32 * Math.PI * 2;
                [18, 60, 120, 200].forEach(function (r) {
                    var h = clone(g);
                    if (!h.tap(g.x + Math.cos(ang) * r, g.y + Math.sin(ang) * r)) return;
                    run(h);
                    h._score = score(h);
                    h._path = (g._path || []).concat([[Math.round(g.x + Math.cos(ang) * r), Math.round(g.y + Math.sin(ang) * r)]]);
                    next.push(h);
                });
            }
        });
        next.sort(function (a, b) { return a._score - b._score; });
        if (next[0]._score < 0) return { n: depth, path: next[0]._path };
        // 去掉位置几乎一样的，保留多样性
        beam = [];
        for (var i = 0; i < next.length && beam.length < 24; i++) {
            var h = next[i];
            if (h._score >= 1e7) break;
            if (beam.some(function (b) { return Math.hypot(b.x - h.x, b.y - h.y) < 14 && b.got.join() === h.got.join(); })) continue;
            beam.push(h);
        }
        if (!beam.length) break;
    }
    return null;
}

var pick = process.argv.slice(2).map(Number);
S.LEVELS.forEach(function (lv, i) {
    if (pick.length && pick.indexOf(i + 1) < 0) return;
    var a = solve(lv, false), b = solve(lv, true);
    console.log((i + 1) + " " + lv.name + "  par " + lv.par +
        "  抵达 " + (a ? a.n : "×") + "  拾齐 " + (b ? b.n : "×") + (b ? "  " + JSON.stringify(b.path) : ""));
});
