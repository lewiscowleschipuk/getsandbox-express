# @gridscale/getsandbox-express
A getsandbox.com to express adapter

## About this fork
* This fork introduces a change to the `require` function, used in the sandbox modules. 
It will execute the code of the required files within a VM, getting an identical context (but not the same!) as the main sandbox script. This enables required modules to use 3rd party modules like lodash and moment and the state. And that enables you to split your sandbox into multiple files. 

* This fork provides the possibility to make the state persistent. Therefore a third parameter `options` is introduced to the `loadSandbox` function. Set property `persistState` to true, will create a `state.json` file next to your sandbox main script. This file will be updated with the current state every second. When restarting the sandbox, it will search for this file and try to restore the state from it's content.

* `console` object is available in modules - so logging can be done

* Environment variables are available in modules in variable `environmentvars`

## Usage

### as command-line tool, without installing

```bash
npx @gridscale/getsandbox-express <main.js> [<port>]
```

Alternatively, if you want to install it globally:

```bash
npm install -g @gridscale/getsandbox-express
sandbox <main.js> [<port>]
```

Default port is `8080`.

### as Node.js module

```js
const sandbox = require('@gridscale/getsandbox-express')
const express = require('express')

const app = express()
sandbox.loadSandbox(app, __dirname + '/mysandbox/main.js')

const port = 8080
app.listen(port, () => {
  console.log(`Sandbox listening on port ${port}.`)
})
```
