const { getSubtitles } = require('youtube-captions-scraper');

async function test() {
  try {
    const captions = await getSubtitles({
      videoID: 'dQw4w9WgXcQ', // Youtube Video ID
      lang: 'en' // default: `en`
    });
    console.log("Success! Extracted lines:", captions.length);
    console.log(captions.slice(0, 3).map(c => c.text).join(' '));
  } catch(e) {
    console.error("Error fetching captions:", e);
  }
}
test();
