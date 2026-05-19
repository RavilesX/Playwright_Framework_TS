// @ts-check
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import  fs from 'fs';
import { buildProjects } from './utils/projectGroups.js';

const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  console.warn(`Environment file ${envFile} not found. Using default environment variables.`);
  dotenv.config();
}

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry 2 times on CI only and 1 times locally*/ 
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. change 'undefined' to 1 to run tests sequentially in others environments apart from CI*/
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['./utils/reporter/CustomHtmlReporter.js']],
  //uncomment this and change this to increase the timeout for the expect assertions, by default is 5 seconds, but in some cases it may be necessary to increase it to avoid false positives
  // expect:{
  //   timeout: 10000
  // }
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    headless: false,
  },

  /* Projects generated from utils/projectGroups.js — one project per device, grouped by prefix (desktop:, ios:, android:). Run a group via npm scripts (test:desktop, test:ios, test:android) or pass multiple --project flags. */
  projects: buildProjects(),

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

