![bitcoin-draw-server](/images/logo.png?raw=true)

# Bitcoin-draw server repository
This repository contains the bitcoin lottery I wrote a while ago. Please, feel free to fork and use this code for whatever reasons you want.

This server get the list of today's transactions to specified address, then once a day it transfers a portion of received funds to a random wallet, a portion distributed to all the participants and a portion to the lottery revenue wallet.

# List of repositories
* [bitcoin-draw-server](https://github.com/backmeupplz/bitcoin-draw-server) — Bitcoin-draw server code
* [bitcoin-draw-website](https://github.com/backmeupplz/bitcoin-draw-website) — Bitcoin-draw website code


# Installation and local launch
1. Clone this repo: `git clone https://github.com/backmeupplz/bitcoin-draw-server`
2. Launch the [mongo database](https://www.mongodb.com/) locally
3. Create `.env` file with environment variables
4. Run `npm i` in the root folder
5. Run `npm run start`

# Environment variables in `.env` file
* `TELEGRAM_TOKEN` — Telegram bot token for admin reports
* `LOTTERY_WALLET` — main BTC lottery wallet
* `REVENUE_WALLET` — revenue BTC wallet
* `LOTTERY_PRIVATE_KEY` — main BTC lottery private key
* `BTC_DB_URL` — url of the mongo db used

# License
MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
