var HOST = 'https://jable.tv';
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function init(cfg) {}

/**
 * 分类列表 (展示在APP顶部的分类)
 */
async function home(filter) {
    let classes = [
        {"type_id": "/latest-updates/", "type_name": "最新更新"},
        {"type_id": "/hot/", "type_name": "近期热门"},
        {"type_id": "/categories/", "type_name": "主题分类"},
        {"type_id": "/models/", "type_name": "模特专区"}
    ];
    return JSON.stringify({ "class": classes });
}

/**
 * 分类页数据提取 (支持翻页)
 */
async function category(tid, pg, filter, extend) {
    if (!pg || pg < 1) pg = 1;
    let url = HOST + tid + (pg > 1 ? "?page=" + pg : "");
    
    // 如果是模特或分类，URL结构略有不同，这里做简单兼容
    let html = await req(url, { headers: { 'User-Agent': UA, 'Referer': HOST } });
    let videos = [];
    
    // 匹配视频列表
    let matches = html.matchAll(/<div class="img-box">[\s\S]*?href="(.*?)".*?data-src="(.*?)".*?alt="(.*?)"/g);
    for (let m of matches) {
        videos.push({
            vod_id: m[1],
            vod_name: m[3],
            vod_pic: m[2],
            vod_remarks: 'P' + pg
        });
    }
    
    return JSON.stringify({
        page: pg,
        pagecount: 99, // Jable 翻页较多，设个大值
        limit: 20,
        total: 2000,
        list: videos
    });
}

/**
 * 详情页解析 (保持不变)
 */
async function detail(id) {
    let url = id.indexOf('http') > -1 ? id : HOST + id;
    let html = await req(url, { headers: { 'User-Agent': UA, 'Referer': HOST } });
    
    let hlsMatch = html.match(/var\s+hlsUrl\s*=\s*['"](.*?)['"]/);
    let playUrl = hlsMatch ? hlsMatch[1] : '';
    
    let nameMatch = html.match(/<title>(.*?)<\/title>/);
    let picMatch = html.match(/poster="(.*?)"/);

    let vod = {
        vod_id: id,
        vod_name: nameMatch ? nameMatch[1].split('-')[0].trim() : "未知视频",
        vod_pic: picMatch ? picMatch[1] : "",
        vod_play_from: "Jable-Stream",
        vod_play_url: "播放$" + playUrl
    };
    return JSON.stringify({ list: [vod] });
}

async function search(wd, pg) {
    let url = HOST + '/search/videos/?search_query=' + encodeURIComponent(wd) + (pg > 1 ? "&page=" + pg : "");
    let html = await req(url, { headers: { 'User-Agent': UA } });
    let videos = [];
    let matches = html.matchAll(/<div class="img-box">[\s\S]*?href="(.*?)".*?data-src="(.*?)".*?alt="(.*?)"/g);
    for (let m of matches) {
        videos.push({
            vod_id: m[1],
            vod_name: m[3],
            vod_pic: m[2]
        });
    }
    return JSON.stringify({ list: videos });
}

export default { init, home, category, detail, search };

