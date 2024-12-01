import fetch from 'node-fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import parse from 'node-html-parser';

const logo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAADbElEQVRYw7XXT4scVRQF8N95r7onmfzDEM1SXYrgJhtxKSoi2WQhohs3fiZdiB9BXIoIQQQXwe8QwZ1RjJNM0pOZ6X4uqma6ZpLJv0oKHlR3Vb177rnn3FuV1pqTjvLVPx5zvIr3xSa+x52Tblx9e+nETbrHRdDl4f9aYwUu4qp4RfOTU7ljI8QzHY8HcNJmZXg2OStOq2KWHnBFe1EAHn3MsKdYir8UC7MsxUzTaRYvG8C72Bf/6fwr5tgVn+A2fu1L9XSblWcOn3ym5ppZFmruS5aSe2quqT4+DFxH67kZGF9dZ3RGLMRCMSdFs1KyFKc1p3R2nC9PxcLTlyBIYEfsKqoyqH4eigfYt5HYyAsvQQbbUS119nWJDjV0iZqVLgszneKiNrDWpgBISDYkVyRf4rSSnT7gEHxd6yr+1pwVX+jyoS7zJ6VYnni1uKD4SHVVZ1P1QNUDKEMR+xWz3DXLadUHZq6a2bBZJmigHt5zQeyZZyUio+yT/jwMZdnTPGjFBSuxmSkAQrPEPcVCSevFOLTpMpyXPkgriWqleYC7qqZlogt6BleHNT8AUIfAodUj3o+mKdl3Km2qC94WF3W5paaN6r1edZgBB7OgS3TZ19lSnFPy3gQX+FTJpmpLTVOTY8rvs685vppql1B9/vwAOld0Fjo5mnkohVoewcjBKsxsq96aIsKiWqipyrDxSAPt0AUjXfTjOIqodiW7U2x4X01Ve8W3OlL+2IZd1v+VkSBLOsUUAAcdb1D8EQAjV4wZ6Ib2W3LwXKY1okFY7aAE5RjdyaEdD1lpo/5QTGxENWvqT2QgxzWw1kaZ0oi6tENai3WtjwBo/fUcE+n6d5tSglmrB13QOtA4W8dachkPsrTBwM8HoHWZq6JLe9iGWQMYl6AXYZM00cTGFAZuqzmr2jsithxmuD4fDaXhnqZkU9yfAuBrnV0158VK1Y4COHhpGdHeaYMLNhSd+GbKNPxN8qYu74g3zDLHPtp4Gg7iXKn2e8rzujiLPfw8zYanbCv+JK+JHXFZ7KlpilVfGitxCZfFUvwhbmEXy2mNaJ4tSz/gd9xRLRXbqk6cwzlFFds4g9viO9zFzvTX8mYXN3FzqPd1sdW/mqUpdpTM8eNA+TZuvMxPs1+GzDbEDWzqv5evD4CX/Sx4us3+ByZsvs2xPtqKAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIxLTA3LTIzVDA0OjE4OjMwKzAwOjAwMBFfDQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMS0wNy0yM1QwNDoxODozMCswMDowMEFM57EAAAAASUVORK5CYII='
interface UserRatingInfo {
    rating: number;
    text: string;
}

function escape(username: string) {
    return encodeURIComponent(username.replace(/-/g, '--').replace(/_/g, '__'));
}

function getRatingColor(rating: number) {
    if (rating >= 2800) return 'FF0000';
    if (rating >= 2400) return 'FF8000';
    if (rating >= 2000) return 'C0C000';
    if (rating >= 1600) return '0000FF';
    if (rating >= 1200) return '00C0C0';
    if (rating >= 800) return '008000';
    if (rating >= 400) return '804000';
    return '808080';
}

async function fetchData(username: string): Promise<UserRatingInfo> {
    const res = await fetch("https://hydro.ac/api", {
        headers: [
            ["content-type", "application/json"],
            ["referer", "https://hydro.ac/"],
        ],
        body: JSON.stringify({"query":"query Example($name: String!) {\n  user(uname: ${username}) {\n    rpInfo\n  }\n}","variables":{"name":"Hydro"},"operationName":"Example"}),
        method: "POST",
    });//This line needs to be modified.
    const html = await res.text();
    const document = parse(html);
    const container = document.querySelector('#main-container');

    if (!res.ok || !container) return { rating: 0, text: 'N/A' };

    const ratingEl = container.querySelector(
        '#user-nav-tabs + table tr:nth-child(2) > td:nth-child(2) > span'
    );
    const textEl = document.querySelector('div.row > div.col-md-3.col-sm-12 > h3 > b');

    if (!ratingEl) return { rating: 0, text: 'Unrated' };

    const rating = Number(ratingEl.innerText.trim());
    const text = textEl?.innerText.trim() || 'N/A';

    return { rating, text: `${text}  ${rating}` };
}

async function getBadgeImage(username: string, data: UserRatingInfo, style: string) {
    const color = getRatingColor(data.rating);
    const escapedUsername = escape(username);
    const escapedRatingText = escape(data.text);

    const params = new URLSearchParams({
        longCache: 'true',
        style,
        logo,
        link: `https://atcoder.jp/users/${username}`,
    }).toString();

    console.log(params);

    const res = await fetch(
        `https://img.shields.io/badge/${escapedUsername}-${escapedRatingText}-${color}.svg?${params}`
    );

    if (!res.ok) throw 'error';
    return await res.text();
}

export default async (request: VercelRequest, response: VercelResponse) => {
    let { username = 'yangrenrui', style = 'for-the-badge' } = request.query;

    if (Array.isArray(username)) username = username[0];
    if (Array.isArray(style)) style = style[0];

    const data = await fetchData(username as string).catch(() => ({ rating: 0, text: 'N/A' }));
    getBadgeImage(username as string, data, style as string)
        .then((data) => {
            response
                .status(200)
                .setHeader('Content-Type', 'image/svg+xml;charset=utf-8')
                .setHeader('Cache-Control', 'public, max-age=43200') // 43200s（12h） cache
                .send(data);
        })
        .catch(() => {
            response.status(500).send('error');
        });
};
