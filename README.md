# Cronometer Targets API

Simple express.js API, that returns macronutrient targets for today by scraping the diary web page with puppeteer

### Example responce:

`curl {url}:{port}/data`
```json
{
    "data": {
        "calories": {
            "consummed": 350.6,
            "target": 2140
        },
        "protein": {
            "consummed": 29.5,
            "target": 150
        },
        "carbs": {
            "consummed": 51,
            "target": 200
        },
        "fat": {
            "consummed": 5,
            "target": 80
        }
    },
}
```
## Installation
```sh
npm install
```

## Basic Usage
```sh
CM_USER=user CM_PASS=pass PORT=80 node cronometer_targets_api.js
```
This will start express.js server that uses headless browser to scrape data from cronometer.
> Important: by default sript runs browser not in sandbox mode which is potenitally dangerous. To disable this behaviour, [configure](https://pptr.dev/troubleshooting/#setting-up-chrome-linux-sandbox) your local environment and set `SANDBOXMODE=true`