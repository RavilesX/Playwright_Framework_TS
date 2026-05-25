# Login Test Plan — Swag Labs (saucedemo)

**Target:** https://www.saucedemo.com/
**Style:** Page Object Model (POM) + Data-Driven Testing (DDT), matching this repo's conventions.
**Status of data:** All selectors and error strings below were verified live against the site via the Playwright MCP browser.

---

## 1. Architecture (how this plan maps to the project)

Same flow as `tests/buyproducttest.spec.ts`:

```
testdata/logindata.json  →  tests/logintest.spec.ts  →  pages/LoginPage.ts
```

- **DDT** — spec reads `testdata/logindata.json` with `readJsonSync('logindata.json')` (from `utils/fileUtils.ts`) and loops each row into a nested `test.describe`, producing N × browsers cases.
- **POM** — all locators + actions live in `pages/LoginPage.ts`. The spec only orchestrates and asserts via page methods (no raw locators in the spec).
- **Env** — `BASE_URL` from `utils/envUtils.ts`; `page.goto(BASE_URL)` at test start.

---

## 2. Page under test — selectors (live-verified)

| Element | Current locator (`LoginPage.ts`) | id / data-test |
|---------|----------------------------------|----------------|
| Username | `getByPlaceholder("Username")` | `#user-name` / `username` |
| Password | `getByPlaceholder("Password")` | `#password` / `password` |
| Login button | `getByText("Login")` | `#login-button` / `login-button` |
| Error banner | _(to add)_ | `[data-test="error"]` |

On success the app routes to `/inventory.html` (title "Products", 6 inventory items).
Direct GET of `/inventory.html` while logged out → error: `Epic sadface: You can only access '/inventory.html' when you are logged in.`

---

## 3. Required Page Object changes (`pages/LoginPage.ts`)

Add an error locator and assertion helpers; keep the existing `login()` action.

```ts
// constructor
this.errorMsg = page.locator('[data-test="error"]');

// new methods
async verifyError(expected: string) {
    await expect(this.errorMsg).toHaveText(expected);
}

async verifyLoggedIn(page: Page) {
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(page.locator('.inventory_item')).toHaveCount(6);
}
```

`LoginPage` already exposes `login(username, password)` and `verifyLoginPage()` — reuse both.

---

## 4. Test data (`testdata/logindata.json`)

DDT rows. `expected` is either `"inventory"` (success) or the exact error string.

```json
[
  { "case": "valid standard_user",        "username": "standard_user",   "password": "secret_sauce", "expected": "inventory" },
  { "case": "locked out user",            "username": "locked_out_user", "password": "secret_sauce", "expected": "Epic sadface: Sorry, this user has been locked out." },
  { "case": "empty username and password","username": "",                "password": "",             "expected": "Epic sadface: Username is required" },
  { "case": "username only, no password", "username": "standard_user",   "password": "",             "expected": "Epic sadface: Password is required" },
  { "case": "password only, no username", "username": "",                "password": "secret_sauce", "expected": "Epic sadface: Username is required" },
  { "case": "unknown username",           "username": "nope",            "password": "secret_sauce", "expected": "Epic sadface: Username and password do not match any user in this service" },
  { "case": "wrong password",             "username": "standard_user",   "password": "wrong",        "expected": "Epic sadface: Username and password do not match any user in this service" },
  { "case": "wrong case username",        "username": "Standard_User",   "password": "secret_sauce", "expected": "Epic sadface: Username and password do not match any user in this service" },
  { "case": "untrimmed whitespace",       "username": " standard_user ", "password": "secret_sauce", "expected": "Epic sadface: Username and password do not match any user in this service" }
]
```

---

## 5. Scenarios (live-verified results)

### Positive
| # | Title | Steps | Expected |
|---|-------|-------|----------|
| L1 | Valid login (`standard_user`) | goto BASE_URL → `login(user, pass)` | URL → `/inventory.html`, title "Products", 6 items |

### Negative
| # | Title | Input | Expected error (exact) |
|---|-------|-------|------------------------|
| L2 | Locked-out user | `locked_out_user` / `secret_sauce` | `Epic sadface: Sorry, this user has been locked out.` |
| L3 | Empty username + password | `""` / `""` | `Epic sadface: Username is required` |
| L4 | Username, no password | `standard_user` / `""` | `Epic sadface: Password is required` |
| L5 | Password, no username | `""` / `secret_sauce` | `Epic sadface: Username is required` |
| L6 | Unknown username | `nope` / `secret_sauce` | `...do not match any user in this service` |
| L7 | Wrong password | `standard_user` / `wrong` | `...do not match any user in this service` |
| L8 | Wrong-case username | `Standard_User` / `secret_sauce` | `...do not match...` (username is case-sensitive) |
| L9 | Untrimmed whitespace | `" standard_user "` / `secret_sauce` | `...do not match...` (input is not trimmed) |

### Edge / security (not DDT-driven; separate `test()` blocks)
| # | Title | Steps | Expected |
|---|-------|-------|----------|
| L10 | Auth guard | logged out → goto `/inventory.html` | redirected to `/`, error: `Epic sadface: You can only access '/inventory.html' when you are logged in.` |
| L11 | Error dismiss | trigger any error → click `[data-test="error-button"]` (X) | error banner removed |
| L12 | Password masking | type into `#password` | field `type="password"` (chars masked) |
| L13 | Injection smoke | `' OR '1'='1` in both fields | "do not match" error, no crash / no auth bypass |

---

## 6. Spec skeleton (`tests/logintest.spec.ts`) — mirrors `buyproducttest.spec.ts`

```ts
import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { BASE_URL } from "../utils/envUtils";
import { readJsonSync } from "../utils/fileUtils";

const jsonData: any[] = readJsonSync('logindata.json');

test.describe('DDT for login', function () {
  for (const data of jsonData) {
    test.describe(`Login: ${data.case}`, function () {
      test('Attempt login', async ({ page }) => {
        await page.goto(BASE_URL);
        const loginPage = new LoginPage(page);

        await loginPage.login(data.username, data.password);

        if (data.expected === 'inventory') {
          await loginPage.verifyLoggedIn(page);
        } else {
          await loginPage.verifyError(data.expected);
        }
      });
    });
  }
});

// L10 — auth guard (non-DDT)
test('Auth guard blocks direct inventory access', async ({ page }) => {
  await page.goto(`${BASE_URL}inventory.html`);
  const loginPage = new LoginPage(page);
  await loginPage.verifyError(
    "Epic sadface: You can only access '/inventory.html' when you are logged in."
  );
});
```

---

## 7. Success criteria

- L1 lands on `/inventory.html` with 6 items.
- L2–L9 each show the exact expected error and stay on `/`.
- L10 blocks direct access with the guard error.
- All cases pass across every project group (desktop / ios / android) defined in `utils/projectGroups.ts`.

## 8. Notes / assumptions

- Fresh, logged-out state assumed at the start of every case (each case re-navigates to BASE_URL).
- Username is case-sensitive and not trimmed (L8, L9 confirmed live).
- `problem_user`, `performance_glitch_user`, `error_user`, `visual_user` all log in with `secret_sauce` but target post-login behavior (UI defects, latency, action errors, visual diffs) — out of scope for this login plan; cover in dedicated specs.
