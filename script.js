const { Innertube } = require('youtubei.js');

async function test() {
  const yt = await Innertube.create();
  const info = await yt.getInfo('dQw4w9WgXcQ');
  try {
    const transcript = await info.getTranscript();
    console.log(JSON.stringify(transcript.transcript.content.body.initial_segments.slice(0, 3), null, 2));
  } catch (err) {
    console.log("No transcript found.", err.message);
  }
}

test();
