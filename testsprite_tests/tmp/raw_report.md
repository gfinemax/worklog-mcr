
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** worklog-mcr
- **Date:** 2025-12-05
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Login with valid credentials
- **Test Code:** [TC001_Login_with_valid_credentials.py](./TC001_Login_with_valid_credentials.py)
- **Test Error:** Login test failed: The user cannot log in successfully with valid credentials as the login modal remains after submission with no success indication. Session persistence test cannot proceed. Reporting the issue and stopping further actions.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://dntgpiqkmvoqbdrzkzmb.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/22cb9959-ebdf-4bf1-aab9-2294198401d5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Login failure with incorrect credentials
- **Test Code:** [TC002_Login_failure_with_incorrect_credentials.py](./TC002_Login_failure_with_incorrect_credentials.py)
- **Test Error:** The login attempt with invalid credentials was performed, but no appropriate error message or toast notification was displayed to indicate login failure. This means the system does not provide visible feedback for incorrect username or password as required by the task. Task is stopped here.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://dntgpiqkmvoqbdrzkzmb.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/a21889c7-4aa7-4389-8aa0-af4faf42c11c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** PIN authentication triggers and validation
- **Test Code:** [TC003_PIN_authentication_triggers_and_validation.py](./TC003_PIN_authentication_triggers_and_validation.py)
- **Test Error:** Unable to proceed with PIN verification testing due to login failures. Reported the issue and stopped further actions.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://dntgpiqkmvoqbdrzkzmb.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://dntgpiqkmvoqbdrzkzmb.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://dntgpiqkmvoqbdrzkzmb.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/27712bad-723f-495c-8397-8b969ba1e138
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Google OAuth login integration
- **Test Code:** [TC004_Google_OAuth_login_integration.py](./TC004_Google_OAuth_login_integration.py)
- **Test Error:** Stopped testing because the Google OAuth login button is not present on the login modal, preventing completion of the login flow test.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/77336944-6f5b-40da-a47d-55de98f0372f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Worklog tab switching and URL update
- **Test Code:** [TC005_Worklog_tab_switching_and_URL_update.py](./TC005_Worklog_tab_switching_and_URL_update.py)
- **Test Error:** Testing stopped due to Internal Server Error on the worklog page. Cannot verify tab switching or data preservation. Please fix the server issue and retry.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://dntgpiqkmvoqbdrzkzmb.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog?mode=today&_rsc=5alhg:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog?mode=today:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/1d2e836e-4aae-49f3-b92b-120690a482b6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Automatic and manual worklog data saving
- **Test Code:** [TC006_Automatic_and_manual_worklog_data_saving.py](./TC006_Automatic_and_manual_worklog_data_saving.py)
- **Test Error:** Stopped testing due to critical navigation failure preventing access to the worklog editing page. Reported the issue for developer investigation.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/worklog?mode=today&_rsc=5alhg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/worklog?mode=today. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:163:33)
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:88:27)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:106)
    at Object.task (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:30:38)
    at PromiseQueue.processNext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:81:186)
    at PromiseQueue.enqueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:45:76)
    at createLazyPrefetchEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:49)
    at getOrCreatePrefetchCacheEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:144:12)
    at navigateReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js:166:82)
    at clientReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/router-reducer.js:25:61)
    at Object.action (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:156:55)
    at runAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:66:38)
    at dispatchAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:120:9)
    at Object.dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:154:40)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:55:29)
    at startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:7968:27)
    at dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:54:13)
    at dispatchAppRouterAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:37:5)
    at dispatchNavigateAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:207:49)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:82:55)
    at exports.startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1150:27)
    at linkClicked (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:81:20)
    at onClick (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:316:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16971:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:872:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17021:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17622:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3312:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17175:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21358:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21326:11) (at webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog?mode=today:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/5a590a43-81d1-4771-8fc6-06ef29fb6fb8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Shift pattern wizard multi-step input and data integrity
- **Test Code:** [TC007_Shift_pattern_wizard_multi_step_input_and_data_integrity.py](./TC007_Shift_pattern_wizard_multi_step_input_and_data_integrity.py)
- **Test Error:** The shift pattern configuration wizard could not be accessed because clicking the '근무패턴 설정' button did not open the wizard interface. Further testing cannot proceed until this issue is resolved.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/settings/worker-pattern?_rsc=5alhg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/settings/worker-pattern. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:163:33)
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:88:27)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:106)
    at Object.task (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:30:38)
    at PromiseQueue.processNext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:81:186)
    at PromiseQueue.enqueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:45:76)
    at createLazyPrefetchEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:49)
    at getOrCreatePrefetchCacheEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:144:12)
    at navigateReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js:166:82)
    at clientReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/router-reducer.js:25:61)
    at Object.action (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:156:55)
    at runAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:66:38)
    at dispatchAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:120:9)
    at Object.dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:154:40)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:55:29)
    at startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:7968:27)
    at dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:54:13)
    at dispatchAppRouterAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:37:5)
    at dispatchNavigateAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:207:49)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:82:55)
    at exports.startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1150:27)
    at linkClicked (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:81:20)
    at onClick (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:316:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16971:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:872:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17021:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17622:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3312:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17175:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21358:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21326:11) (at webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/settings/worker-pattern:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/9dd6547a-271c-4532-a03a-af93f8586da4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Worker assignment in shift pattern wizard
- **Test Code:** [TC008_Worker_assignment_in_shift_pattern_wizard.py](./TC008_Worker_assignment_in_shift_pattern_wizard.py)
- **Test Error:** Reported the issue that the shift pattern wizard cannot be accessed by clicking the '근무패턴 설정' button, blocking further testing of unassigned workers and shift assignments. Stopping all further actions.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/settings/worker-pattern?_rsc=5alhg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/settings/worker-pattern. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:163:33)
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:88:27)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:106)
    at Object.task (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:30:38)
    at PromiseQueue.processNext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:81:186)
    at PromiseQueue.enqueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:45:76)
    at createLazyPrefetchEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:49)
    at getOrCreatePrefetchCacheEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:144:12)
    at navigateReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js:166:82)
    at clientReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/router-reducer.js:25:61)
    at Object.action (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:156:55)
    at runAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:66:38)
    at dispatchAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:120:9)
    at Object.dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:154:40)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:55:29)
    at startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:7968:27)
    at dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:54:13)
    at dispatchAppRouterAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:37:5)
    at dispatchNavigateAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:207:49)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:82:55)
    at exports.startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1150:27)
    at linkClicked (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:81:20)
    at onClick (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:316:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16971:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:872:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17021:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17622:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3312:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17175:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21358:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21326:11) (at webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/settings/worker-pattern:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/372239de-1e7c-4465-ad5e-94482650d824
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Create and edit community board post with image upload
- **Test Code:** [TC009_Create_and_edit_community_board_post_with_image_upload.py](./TC009_Create_and_edit_community_board_post_with_image_upload.py)
- **Test Error:** Navigation to the community board post creation page failed. The '포스트 목록' link does not work as expected, preventing further testing of post creation and editing functionalities. Reporting this issue and stopping the test.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/posts?_rsc=5alhg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/posts. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:163:33)
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:88:27)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:106)
    at Object.task (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:30:38)
    at PromiseQueue.processNext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:81:186)
    at PromiseQueue.enqueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:45:76)
    at createLazyPrefetchEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:49)
    at getOrCreatePrefetchCacheEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:144:12)
    at navigateReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js:166:82)
    at clientReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/router-reducer.js:25:61)
    at Object.action (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:156:55)
    at runAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:66:38)
    at dispatchAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:120:9)
    at Object.dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:154:40)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:55:29)
    at startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:7968:27)
    at dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:54:13)
    at dispatchAppRouterAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:37:5)
    at dispatchNavigateAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:207:49)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:82:55)
    at exports.startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1150:27)
    at linkClicked (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:81:20)
    at onClick (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:316:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16971:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:872:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17021:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17622:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3312:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17175:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21358:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21326:11) (at webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/e3f144eb-438e-40d5-b2fd-38932cf05625
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Post comments with emoji picker and optimistic UI
- **Test Code:** [TC010_Post_comments_with_emoji_picker_and_optimistic_UI.py](./TC010_Post_comments_with_emoji_picker_and_optimistic_UI.py)
- **Test Error:** Testing stopped due to Internal Server Error on the community post detail page, preventing further test steps for emoji comment functionality.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/posts?_rsc=5alhg:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/posts:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/1cc02d27-8070-45c6-9fe8-c76016873317
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** AI-generated summary reliability for community posts
- **Test Code:** [TC011_AI_generated_summary_reliability_for_community_posts.py](./TC011_AI_generated_summary_reliability_for_community_posts.py)
- **Test Error:** Reported the issue with the '포스트 목록' navigation link being unresponsive, preventing further testing of AI-generated summaries on posts. Stopping all actions.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/posts?_rsc=5alhg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/posts. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:163:33)
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:88:27)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:106)
    at Object.task (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:30:38)
    at PromiseQueue.processNext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:81:186)
    at PromiseQueue.enqueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:45:76)
    at createLazyPrefetchEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:49)
    at getOrCreatePrefetchCacheEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:144:12)
    at navigateReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js:166:82)
    at clientReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/router-reducer.js:25:61)
    at Object.action (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:156:55)
    at runAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:66:38)
    at dispatchAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:120:9)
    at Object.dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:154:40)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:55:29)
    at startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:7968:27)
    at dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:54:13)
    at dispatchAppRouterAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:37:5)
    at dispatchNavigateAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:207:49)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:82:55)
    at exports.startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1150:27)
    at linkClicked (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:81:20)
    at onClick (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:316:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16971:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:872:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17021:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17622:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3312:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17175:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21358:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21326:11) (at webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/05824743-9bae-4923-842e-c87434933908
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Broadcast schedule filtering with color-coded legend
- **Test Code:** [TC012_Broadcast_schedule_filtering_with_color_coded_legend.py](./TC012_Broadcast_schedule_filtering_with_color_coded_legend.py)
- **Test Error:** Testing to verify broadcasts list filtering by schedule and color coding cannot proceed due to critical website issues. Navigation to broadcasts list page failed and alternative navigation leads to Internal Server Error. The issue has been reported. Task stopped.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog?_rsc=5alhg:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/75783208-e3c5-4dd5-a419-91e8a5747848
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** Broadcast monitor page responsiveness and full-screen layout
- **Test Code:** [TC013_Broadcast_monitor_page_responsiveness_and_full_screen_layout.py](./TC013_Broadcast_monitor_page_responsiveness_and_full_screen_layout.py)
- **Test Error:** The task to ensure the broadcast detailed monitoring view adapts responsively and functions in full-screen mode cannot be completed because the navigation to the broadcast monitor page is broken. The issue has been reported. Stopping all further actions.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/broadcasts/today?_rsc=5alhg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/broadcasts/today. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:163:33)
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:88:27)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:106)
    at Object.task (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:30:38)
    at PromiseQueue.processNext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:81:186)
    at PromiseQueue.enqueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/promise-queue.js:45:76)
    at createLazyPrefetchEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:197:49)
    at getOrCreatePrefetchCacheEntry (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/prefetch-cache-utils.js:144:12)
    at navigateReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js:166:82)
    at clientReducer (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/router-reducer/router-reducer.js:25:61)
    at Object.action (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:156:55)
    at runAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:66:38)
    at dispatchAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:120:9)
    at Object.dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:154:40)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:55:29)
    at startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:7968:27)
    at dispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:54:13)
    at dispatchAppRouterAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/use-action-queue.js:37:5)
    at dispatchNavigateAction (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-instance.js:207:49)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:82:55)
    at exports.startTransition (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1150:27)
    at linkClicked (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:81:20)
    at onClick (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js:316:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16971:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:872:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17021:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17622:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3312:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17175:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21358:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21326:11) (at webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.5.6_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js:56:31)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/broadcasts/today:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/84470fe2-c9be-43d2-9c20-3737d4da71d5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Dark mode toggle and UI consistency
- **Test Code:** [TC014_Dark_mode_toggle_and_UI_consistency.py](./TC014_Dark_mode_toggle_and_UI_consistency.py)
- **Test Error:** Testing stopped due to Internal Server Error on the worklog page. Dark mode toggle was not found on dashboard or login pages. Worklog page inaccessible, blocking further testing. Please fix the server error to continue testing.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog?_rsc=5alhg:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/worklog:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/bc250b75-a895-4558-b876-01d556c30cd8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Responsive sidebar toggle on mobile devices
- **Test Code:** [TC015_Responsive_sidebar_toggle_on_mobile_devices.py](./TC015_Responsive_sidebar_toggle_on_mobile_devices.py)
- **Test Error:** Testing stopped due to Internal Server Error on the page. Sidebar toggle and navigation functionality cannot be tested in this state.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/8917c344-3371-41ab-b58a-c820ad16c6d6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** API failure handling with user-friendly error toasts
- **Test Code:** [TC016_API_failure_handling_with_user_friendly_error_toasts.py](./TC016_API_failure_handling_with_user_friendly_error_toasts.py)
- **Test Error:** Stopped testing due to missing error toast on login API failure. The UI does not provide user-friendly error feedback on backend failure during login, which blocks further testing of other features. Please investigate and fix error handling and UI feedback for API failures.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/775ce46f-d23c-41ba-a643-7e4a8b5bd336/c8f0f016-3bec-49c3-8afc-b2b7ebc90a05
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---