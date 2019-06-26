# Click-In-Text
Adapted from the amazing chrome extension TransOver under MIT license

If you don't know much about chrome extensions: \
Read [google extension official overview](https://developer.chrome.com/extensions/overview) to know the basic relationship of the files.
Specifically `contentscript.js` `background.js`.

## Install

Under project root directory

- `npm install`

## Directory Structure

important files/directories:

`./icons`: Icon of this extension in different resolution. Check ./icons/README.md for how to generate icons.

`./lib`: Core Javascript code that are reusable (browser invariant)

`./background.js` `./contentscript.js`: Chrome extension components

`./options.html`: Chrome extension component

`./test.html`: Test page for cypress to test the UI of the extension. Specifically excluded in the final extension (zip file)

`./test.js`: Test script that goes with test.html to make sure core javascript code and can be thoroughly tested.
Specifically excluded in the final extension (zip file). It basically patches the functions in `contentscript.js` and `background.js`
to make javascript of this plugin browser invariant.

### why `test.js`

 It's not possible to test the plugin's UI as a specific browser plugin as cypress lacks the access to their API. For example 
 in chrome you can't detect plugin menu on the upper right side of Chrome. You can't open options.html as a chrome plugin settings page
 because it's not possible for cypress to click on the menu nor get the url of the page (which is allocated by chrome and only
 accessible through chrome API `getURL`, the `crhome://extensions/safdjsaifjg/options.html` url you see in the browser is understood
 and routed by chrome and it's not possible to visit inside cypress)

## Development Routine


1. `npm run dev` (This will watch file changes and repack everything to `./dist` upon file change)

2. Go to `chrome://extensions`. Toggle on developer mode ![developer_mode.png](readme_assets/developer_mode.png). This enables
you to load local unzipped directories as chrome extensions.

3. Click on "Load unpacked" ![load_unpacked.png](readme_assets/load_unpacked.png)  as choose the generated `./dist` directory.
This loads the code generated in `./dist` as a chrome plugin.

4. Does stuff to the code. Files will be regenerated in `./dist`

5. Go to `chrome://extensions` and hit the refresh button ![refresh.png](readme_assets/refresh.png) on your extension card. This will
reload the directory `./dist` as a chrome plugin.

6. (Optional) Manual Testing: Go to any new tab or reload an existing tab to see the changes you just made.

7. (Optional) Automatic Testing: `npm test` to run cypress testing. (Doesn't require step 5. It uses `test.js`, as explained earlier [here](#why-testjs))

8. Go back to 4. Do more stuff to the code


Pro tips/Notes:

- Step 2. 3. is only needed once. The browser remembers the directory of the plugin.

- You can `npx cypress open` and do everything in cypress built-in chrome. Everything will be the same plus at Step 7 You can use
cypress testing UI and make everything faster by omitting the need to start a browser.

- As explained earlier [here](#why-testjs). Cypress test at Step 7 tests the browser invariant version of the extension
 provided by `test.js`. Not the extension you loaded at step 2 and 3. Depending on the consistency between `test.js` and browser API behaviors. Cypress may go through a 
 different user experience than what a real user would go through via a browser extension. 
 You may want to do manual testing at step 6 now and then to really find out.

- If you frequently do manual testing, step 5 and 6 of going to a different tab to refresh extension and going back to reload page may be exhausting. Use 
this chrome extension as a development tool in your browser.
https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid?hl=en This extension provides
a fake url `http://reload.extensions`. You can visit this url on any tab to reload your extension and reload the tab at one go.

    (FYI, if you use cypress browser. Downloaded extensions do persist with your cypress browser over cypress restarts
 so you don't need to worry about re-downloading the tool)







