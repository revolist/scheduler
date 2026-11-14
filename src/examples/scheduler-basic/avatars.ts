/// <reference types="vite/client" />
// Existing local profile photos, bundled with this example.
import iris from './assets/iris.webp';
import elias from './assets/elias.webp';
import zoe from './assets/zoe.webp';
import owen from './assets/owen.webp';
import clara from './assets/clara.webp';
import felix from './assets/felix.webp';
import sienna from './assets/sienna.webp';
import hugo from './assets/hugo.webp';

// Resolve Angular file-loader assets against its bundle, not the demo route.
const portraitUrl = (asset: string) => new URL(asset, import.meta.url).href;
export const portraits = {
  iris: portraitUrl(iris),
  elias: portraitUrl(elias),
  zoe: portraitUrl(zoe),
  owen: portraitUrl(owen),
  clara: portraitUrl(clara),
  felix: portraitUrl(felix),
  sienna: portraitUrl(sienna),
  hugo: portraitUrl(hugo),
};
