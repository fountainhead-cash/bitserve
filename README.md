# bitserve

> Bitdb Microservice

An API Endpoint + Web Query UI for BitDB


# How it works

This project contains:

1. BitDB Microservice API Endpoint: An HTTP API Endpoint to your BitDB
2. BitDB Query Web UI: As seen in [https://bitdb.fountainhead.cash/explorer](https://bitdb.fountainhead.cash/explorer)

# Prerequisites

You must have the following installed.

1. Bitcoin Full Node: Any BCH node implementation
2. Bitdb Node: Bitdb is a universal bitcoin database that autonomously synchronizes with Bitcoin https://github.com/fountainhead-cash/bitd


# Install

**Clone the Bitserve repository:**
```
git clone https://github.com/fountainhead-cash/bitserve.git && cd bitserve
```

**Install dependencies:**
```
npm install
```

**Configure Bitserve:**

You can configure the service with .env, just copy .env.example to .env and edit it to match your system.

```
cp .env.example .env
```

To enable/disable rate-limiting change `ratelimit_disabled` to either 1 for off or 0 for on. `ratelimit_requests` is enforced in a 60-second window. `same_domain_sockserve` should be set to 1 only if your webserver set to serve sockserve's /channel page and /s/ API endpoint on the same domain as bitserve.

```
vim .env
```

### Running as a daemon

**Install PM2 using NPM**
```
npm install pm2 -g
```

**Start bitserve**
```
pm2 start index.js --name="Bitserve"
```



## Join the Community

- Chat: Join fountainhead.cash Telegram channel, ask questions, share your projects, etc. [Open chat](http://t.me/fountainheadcash)
