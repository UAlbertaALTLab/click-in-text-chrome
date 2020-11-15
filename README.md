# Click-In-Text-Chrome

Adapted from [TransOver](https://github.com/artemave/translate_onhover), the amazing chrome extension under MIT license

If you don't know much about chrome extensions: \
Read [google extension official overview](https://developer.chrome.com/extensions/overview) to know the basic relationship of the files.
Specifically `contentscript.js` `background.js`.

## Install

Under project root directory

- `npm install`

## Directory Structure

##### What's compiled by webpack and goes into zipped build

`./icons`: Icon of this extension in different resolution. Check `./icons/README.md` for how to generate icons.

`./lib`: Core Javascript code that are reusable (browser invariant). 
ECMAScript Module is used.

`./background.js` `./contentscript.js` `./options.html`: Chrome-extension specific files

##### Others

`./libexec`: build/dev scripts. Node scripts are preferred over shell script for cross-platform compatibility. 

`./test.html`: Test page for cypress to test the UI of the extension.

`./test.js`: Test script that goes with `test.html` to make sure core javascript code and can be thoroughly tested. 
It basically mocks the functions in `contentscript.js` and `background.js` to run the plugin.

### why `test.js`

We use cypress to do integration tests,
while it's not possible to test the plugin's UI as a specific browser plugin as cypress lacks the access to their API.
For example in cypress you can't detect plugin menu on the upper right side of Chrome.
You can't open `options.html` as a chrome plugin settings page 
because it's not possible for cypress to click on the menu nor get the url of the page 
(which is allocated by chrome and only accessible through chrome API `getURL`, 
the `crhome://extensions/safdjsaifjg/options.html` url you'll see in the browser is understood
 and routed by chrome and it's not possible to visit inside cypress)
 
`test.js` mocks the browser apis to make the extension code work embedded on a web-page.

## Development Routine


1. `npm run dev` (This will watch file changes and repack everything to `./dist` upon file change)

2. Write some bugs. Files will be regenerated in `./dist`

3. Test as embedded javascript: Make sure you have disabled this extension on your browser. `npm test` to run cypress tests. (It uses `test.html` `test.js` and runs the extension code as embedded javascript, as explained earlier)

4. (Optional) Manual Testing as an extension: Make sure you have installed the extension in development mode as instructed below. The installation only needs to be done once for any browser. Create any new tab or reload an existing tab to test the changes you just made.

5. Go back to 2. Write more bugs.


Pro tips/Notes:

- You can `npx cypress open` and do everything in cypress built-in chrome. Everything will be the same plus at Step 3 You can use
cypress testing UI and make everything faster by omitting the need to restart a browser.

- As explained earlier. Cypress test at Step 3 tests the extension code as embedded javascript enabled by `test.js`. Depending on the consistency between `test.js` and browser API behaviors. Cypress may go through a 
 different user experience than what a real user would go through via a browser extension. 
 You may want to do manual testing now and then to really find out.

- If you frequently do manual testing, step 5 and 6 of going to a different tab to refresh extension and going back to reload page may be exhausting. Use 
this chrome extension as a development tool in your browser.
https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid?hl=en This extension provides
a fake url `http://reload.extensions`. You can visit this url on any tab to reload your extension and reload the tab at one go.

(FYI, if you use cypress browser. Downloaded extensions do persist with your cypress browser over cypress restarts
 so you don't need to worry about re-downloading the tool)



## Install dev

1. On the browser, go to `chrome://extensions`. Toggle on developer mode ![developer_mode.png](readme_assets/developer_mode.png). This enables
you to load local unzipped directories as chrome extensions.

2. Click on "Load unpacked" ![load_unpacked.png](readme_assets/load_unpacked.png)  and choose the generated `./dist` directory.
This loads the code generated in `./dist` as a chrome plugin.

## Linter

`.eslintrc` and `.eslintignore` are both present. To project javascript manually, 
run `$ eslint [--fix] .` under project root. 

We also have a Github action that runs `eslint --fix .` and commits automatically to enforce formatting.