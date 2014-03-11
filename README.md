twitterstreamer
===============

Twitter Streamer is a simple applications that streams images from Twitter users or tweets with certain hashtags to connected V-Tablets.

How it works
------------

With [twit](https://github.com/ttezel/twit) node module we start listening to Twitter streaming API for users and hastags specified in config file.
When new tweet with image or instagram url arrives we send it to devices with [engine.io](https://github.com/LearnBoost/engine.io).

Installation
------------

* Install node.js and npm
* Copy config.js.example to config.js and edit it
	* Create new [Twitter app](https://apps.twitter.com/)
	* Copy API auth keys
	* Set users and/or hashtags you want to display
* Start application with `node index.js`