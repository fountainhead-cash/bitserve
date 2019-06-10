require('dotenv').config()
const express = require('express')
const bitqueryd = require('fountainhead-core').bitqueryd
const PQueue = require('p-queue')
const ip = require('ip')
const app = express()
const rateLimit = require("express-rate-limit")
const cors = require("cors")

const config = {
  "query": {
    "v": 3,
    "q": { "find": {}, "limit": 10 }
  },
  "name": process.env.db_name ? process.env.db_name : "bitdb",
  "url": process.env.db_url ? process.env.db_url : "mongodb://localhost:27017",
  "port": Number.parseInt(process.env.bitserve_port ? process.env.bitserve_port : 3000),
  "timeout": Number.parseInt(process.env.bitserve_timeout ? process.env.bitserve_timeout : 30000),
  "log": process.env.bitserve_log ? process.env.bitserve_log == 'true' : true
};

const concurrency = ((config.concurrency && config.concurrency.aggregate) ? config.concurrency.aggregate : 3)
const queue = new PQueue({concurrency: concurrency})

var db

app.set('view engine', 'ejs')
app.use(express.static('public'))

// create rate limiter for API endpoint,ß bypass whitelisted IPs
var whitelist = []
if (process.env.whitelist) {
  whitelist = process.env.whitelist.split(',')
}
var ratelimit_disabled = false;
if (process.env.ratelimit_disabled) {
  ratelimit_disabled = process.env.ratelimit_disabled
}
app.use(cors())
app.enable("trust proxy")
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: Number.parseInt(process.env.ratelimit_requests ? process.env.ratelimit_requests : 300), // Requests per windowMs
  handler: function(req, res, /*next*/) {
    res.format({
      json: function() {
        res.status(500).json({
          error: "Too many requests. Limits are 300 requests per minute."
        })
      }
    })
  },
  skip: function (req, /*res*/) {
    if (ratelimit_disabled == true || whitelist.includes(req.ip)) {
      return true
    } else {
      return false
    }
  }
})
app.get(/^\/q\/(.+)/, cors(), limiter, async function(req, res) {
  var encoded = req.params[0];
  let r = JSON.parse(new Buffer(encoded, "base64").toString());
  if (r.q && r.q.aggregate) {
    // add to aggregate queue
    console.log("# Aggregate query. Adding to queue", queue.size)
    queue.add(async function() {
      // regular read
      let result = await db.read(r)
      if (config.log) {
        console.log("query = ", r)
        console.log("response = ", result)
      }
      console.log("Done", queue.size-1)
      res.json(result)
    })
  } else {
    // regular read
    let result = await db.read(r)
    if (config.log) {
      console.log("query = ", r)
      console.log("response = ", result)
    }
    res.json(result)
  }
})
app.get(/^\/explorer\/(.+)/, function(req, res) {
  let encoded = req.params[0]
  let decoded = Buffer.from(encoded, 'base64').toString()
  res.render('explorer', { code: decoded, sockserve: process.env.same_domain_sockserve })
});
app.get('/explorer', function (req, res) {
  res.render('explorer', { code: JSON.stringify(config.query, null, 2), sockserve: process.env.same_domain_sockserve })
});
app.get('/', function(req, res) {
  res.redirect('/explorer')
});
app.get(/^\/explorer2\/(.+)/, function(req, res) {
  let encoded = req.params[0]
  let decoded = Buffer.from(encoded, 'base64').toString()
  res.render('explorer2', { code: decoded, sockserve: process.env.same_domain_sockserve })
});
app.get('/explorer2', function (req, res) {
  res.render('explorer2', { code: JSON.stringify(config.query, null, 2), sockserve: process.env.same_domain_sockserve })
});
app.get('/', function(req, res) {
  res.redirect('/explorer')
});
var run = async function() {
  db = await bitqueryd.init({
    url: (config.url ? config.url : process.env.url),
    timeout: config.timeout,
    name: config.name
  })
  app.listen(config.port, () => {
    console.log("######################################################################################");
    console.log("#")
    console.log("#  BITSERVE: BitDB Microservice")
    console.log("#  Serving Bitcoin through HTTP...")
    console.log("#")
    console.log(`#  Explorer: ${ip.address()}:${config.port}/explorer`);
    console.log(`#  API Endpoint: ${ip.address()}:${config.port}/q`);
    console.log("#")
    console.log("#  Learn more at https://docs.fountainhead.cash")
    console.log("#")
    console.log("######################################################################################");
  })
}
run()
