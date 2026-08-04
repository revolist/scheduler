import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const commercialStyles = [
  {
    production: '@revolist/revogrid-pro/dist/revogrid-pro.css',
    trial: '@revolist/revogrid-pro/dist/rv-pro-trial.css',
  },
  {
    production: '@revolist/revogrid-enterprise/dist/revogrid-enterprise.css',
    trial: '@revolist/revogrid-enterprise/dist/rv-enterprise-trial.css',
  },
] as const;

export function resolveCommercialCssAliases() {
  return Object.fromEntries(
    commercialStyles.flatMap(({ production, trial }) => {
      try {
        require.resolve(trial);
        return [[production, trial]];
      } catch {
        return [];
      }
    }),
  );
}

