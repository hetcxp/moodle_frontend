import { MoodleApi } from './src/services/moodle-api.js';

async function test() {
  try {
    const data = await MoodleApi.call('local_headless_get_autologin_key', {});
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
