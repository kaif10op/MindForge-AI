const { videoInfo } = require('youtube-ext');

async function test() {
  try {
    const info = await videoInfo('dQw4w9WgXcQ');
    if (info.captions && info.captions.length > 0) {
      console.log('Found captions:', info.captions.length);
      const url = info.captions[0].url;
      const res = await fetch(url);
      const text = await res.text();
      console.log(text.substring(0, 100)); // Should be xml based transcript
    } else {
      console.log('No captions found');
    }
  } catch (e) {
    console.error(e);
  }
}
test();
