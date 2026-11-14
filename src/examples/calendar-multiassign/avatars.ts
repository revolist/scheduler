// Reused local portraits from the planning demo; bundled for every preview framework.
import maya from './assets/maya.webp';
import leo from './assets/leo.webp';
import ava from './assets/ava.webp';
import noah from './assets/noah.webp';
import nina from './assets/nina.webp';

// Angular is mounted in the shared demo page, so resolve file-loader paths
// against the bundle rather than the current route.
const portraitUrl = (asset: string) => new URL(asset, import.meta.url).href;
export const calendarAvatars = {
  maya: portraitUrl(maya),
  leo: portraitUrl(leo),
  ava: portraitUrl(ava),
  noah: portraitUrl(noah),
  nina: portraitUrl(nina),
};
