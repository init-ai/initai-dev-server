# Init.ai Dev Server

A training server and toolkit for developing Projects on the [init.ai](https://init.ai) platform.

> **Note:** This project is currently in a beta release phase and subject to change at any time.

## Pull Requests and Contributions

At the current time, this project is not developed openly on Github. We hope to change that soon, but in the meantime, any PRs will have to be reviewed and manually applied by Init.ai team members.

We will provide a list of contributors and make sure to acknowledge all feedback we receive.

> **Note:** Currently, this project is not distributed under a permissive open source license. Contributions will be accepted with the understanding that they become part of our IP. This is likely to change in the future and we will update this repository accordingly at that time.

## Installation

Make sure you have Node.js installed. We recommend using version [`4.3.2`](https://nodejs.org/en/download/releases/) (see below). If you are using a tool such as [`nvm`](https://github.com/creationix/nvm) simply run:

```bash
$ nvm install 4.3.2
$ nvm use 4.3.2
```

This recommendation is made due to end ensure you are running the same version of Node that is available in [AWS Lambda](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html). While the developer tools do not _currently_ interact with or represent Lambda, upcoming features will require this version.

## Training Server

> *Note:* > When an Init.ai,  project is created, the `package.json` will contain the Dev Server in its dependencies. All you will need to do is run `npm install` to fetch this dependency.

The server contained in the Dev Server acts as a bridge between your production console and your local file system. This will start a server on your local machine that can communicate with the console running in your browser. It does this by facilitating a websocket connection between the two allowing changes to conversation data in the browser to be persisted locally via CML files.

To run the server, make sure you are in the directory of your working project (`cd /path/to/my-project`) and run the `server` command:

```bash
$ npm start
```

You will notice the console will reflect successful connection status immediately. You can of course, at any time, kill this server and the browser will no longer have access to any locally running codebase.

## Supported Platforms

* Mac OS X 10.10+
* Windows 8.1+
* Linux
