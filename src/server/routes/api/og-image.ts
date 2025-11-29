import { defineEventHandler, getQuery } from 'h3';
import { ImageResponse } from '@cf-wasm/og/workerd';
import { html } from 'satori-html';

export default defineEventHandler(async (event) => {
    const fontFile = await fetch(
        'https://cdn.jsdelivr.net/npm/@fontsource/geist-sans/files/geist-sans-latin-700-normal.woff',
    );
    const fontData: ArrayBuffer = await fontFile.arrayBuffer();
    const query = getQuery(event);


    const template = html`
<div
  style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;"
>
  <p>Renders HTML</p>
  <p>Hello World!</p>
</div>

`;

    return await ImageResponse.async(template, {
        width: 1200,
        height: 630,
        fonts: [
            {
                name: 'Geist Sans',
                data: fontData,
                weight: 700,
                style: 'normal',
            },
        ],
    });
});