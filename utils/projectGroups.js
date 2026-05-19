import { devices } from '@playwright/test';

// Usage:
// All: npm run test:dev
// Group: npm run test:desktop / test:ios / test:android
// Single device: npx playwright test --project="ios:iPhone 14"

const GROUPS = {
  desktop: ['Desktop Chrome', 'Desktop Firefox'],
  ios:     ['iPhone 12', 'iPhone 14', 'iPad Pro 11'],
  android: ['Pixel 5', 'Nokia N9', 'Galaxy S9+'],
};

function buildProjects() {
  return Object.entries(GROUPS).flatMap(([group, list]) =>
    list.map(device => ({
      name: `${group}:${device}`,
      use: { ...devices[device] },
    }))
  );
}

export { buildProjects };
