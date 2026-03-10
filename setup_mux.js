const muxTokenId = '649e14a5-0340-4ac9-8418-4a5824fad316';
const muxTokenSecret = 'ZToMN4N5YO1aguqQ+2p0QpHTJkFaHhiF+E+F3RfA10sbTye6wavishaeuc2w6XhhUJ8WFax/n6c';

async function createLiveStream() {
    const credentials = Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64');

    try {
        const response = await fetch('https://api.mux.com/video/v1/live-streams', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playback_policy: ['public'],
                new_asset_settings: { playback_policy: ['public'] },
                reconnect_window: 60
            })
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
}

createLiveStream();
