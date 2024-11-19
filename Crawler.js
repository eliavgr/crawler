const axios = require('axios');
const cheerio = require('cheerio');
const { log } = require('console');
const fs = require('fs');
const path = require('path');

const visitedUrls = new Set();
const results = [];

async function crawl(url, depth, currentDepth = 0) {
    if (currentDepth > depth || visitedUrls.has(url)) return;
    visitedUrls.add(url);

    try {
        const { data } = await axios.get(url);
        // console.log("data: ",data);

        const $ = cheerio.load(data);

        // Extract images
        $('img').each((_, img) => {
            console.log(`scanning images ${results.length}...`);
            const imageUrl = $(img).attr('src') || $(img).attr('data-src');
            // console.log("img: ",imageUrl);
            if (imageUrl) {
                results.push({
                    imageUrl: imageUrl,
                    sourceUrl: url,
                    depth: currentDepth
                });
            }           
        });
        // console.log("results: ",results);

        // Extract links and crawl deeper if needed
        if (currentDepth <= depth) {
            const links = $('a[href]').map((_, a) => $(a).attr('href')).get();
            for (const link of links) {
                const fullUrl = link.startsWith('http') ? link : new URL(link, url).href;
                await crawl(fullUrl, depth, currentDepth + 1);
            }
        }
    } catch (err) {
        console.error(`Error fetching ${url}:`, err.message);
    }
}

async function main() {
    const [url, depth] = process.argv.slice(2);
    if (!url || isNaN(depth)) {
        console.error('Usage: node crawler.js <url: string> <depth: number>');
        process.exit(1);
    }

    console.log(`Crawling ${url} with depth ${depth}`);
    await crawl(url, parseInt(depth));

    // Save results to results.json
    const filePath = path.join(__dirname, 'results.json');
    fs.writeFileSync(filePath, JSON.stringify({ results }, null, 2));
    console.log(`Crawling completed. Results saved to ${filePath}`);
}

main();