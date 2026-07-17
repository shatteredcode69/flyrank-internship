const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const BASE_URL = 'http://quotes.toscrape.com';

async function debugScraper() {
    console.log('🚀 Starting Debug Scraper...');
    const targetUrl = `${BASE_URL}/page/1/`;
    
    try {
        // Fetch page 1 using a standard browser User-Agent to bypass basic blocks
        console.log(`\n📄 Fetching ${targetUrl}...`);
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });

        // Peek at the raw HTML we received
        console.log('\n--- RAW HTML PREVIEW (First 200 chars) ---');
        console.log(response.data.substring(0, 200));
        console.log('------------------------------------------\n');

        // Load into Cheerio
        const $ = cheerio.load(response.data);
        const quotesOnPage = $('.quote');

        console.log(`🔍 Cheerio found ${quotesOnPage.length} elements with class="quote"`);

        if (quotesOnPage.length === 0) {
            console.log('❌ Error: The HTML does not contain the expected data. Check the raw HTML preview above.');
            return;
        }

        let allQuotes = [];

        // Extract
        quotesOnPage.each((index, element) => {
            const text = $(element).find('.text').text().trim();
            const author = $(element).find('.author').text().trim();
            
            allQuotes.push({ text: text, author: author });
        });

        // Save
        await fs.writeFile('corpus.json', JSON.stringify(allQuotes, null, 2));
        console.log(`\n🎉 Success! Saved ${allQuotes.length} records to corpus.json`);

    } catch (error) {
        console.error(`\n❌ Network Error:`, error.message);
    }
}

debugScraper();