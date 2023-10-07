"use strict";

const express = require("express")
const puppeteer = require("puppeteer");
const flatCache = require("flat-cache");
const fs = require("fs");
require('dotenv').config()

const PORT = process.env.PORT || 50901;
const USERNAME = process.env.CM_USER
const PASSWORD = process.env.CM_PASS
const API_KEY = process.env.API_KEY
const HEADLESS = process.env.HEADLESS === "false" ? false : true;
const SANDBOXMODE = process.env.SANDBOXMODE === "true" ? true : false;

async function scrapeData() {
    let freshLogin = false;
    const browser = await puppeteer.launch({
        headless: HEADLESS,
        args: SANDBOXMODE ? [] : ['--no-sandbox']
    });
    const page = await browser.newPage();
    // page.on("console", consoleObj => console.log(consoleObj.text()));

    const cookies = JSON.parse(cache.getKey("cookie"));
    for (let cookie of cookies) {
        await page.setCookie(cookie);
    }  

    await page.goto('https://cronometer.com/');
    await page.setViewport({width: 1480, height: 1024});

    await page.waitForSelector(".dashboard-card", {timeout: 10000})
        .catch(async () => {
            freshLogin = true;
            await page.goto('https://cronometer.com/login/');
            await page.waitForSelector("#login_user_form input[name=username]");
            const emailInput = "#login_user_form input[name=username]";
            const passwordInput = "#login_user_form input[name=password]";
            const loginSubmitBtn = "#login_user_form button[type=submit]";
            await page.focus(emailInput);
            await page.type(emailInput, USERNAME);
            await page.type(passwordInput, PASSWORD);
            await page.click(loginSubmitBtn);
            await page.waitForSelector(".dashboard-card");
        })


    const pageCookies = await page.cookies();
    cache.setKey("cookie", JSON.stringify(pageCookies));
    cache.save(true);
  
    await page.goto('https://cronometer.com/#diary');
    await page.waitForSelector(".diary-panel");

    const cal = await page.evaluate(() => document.querySelector(".summary-energy .nutrient-target-bar-text").textContent);
    const protein = await page.evaluate(() => document.querySelector(".summary-protein .nutrient-target-bar-text").textContent);
    const carbs = await page.evaluate(() => document.querySelector(".summary-carbs .nutrient-target-bar-text").textContent);
    const fat = await page.evaluate(() => document.querySelector(".summary-fat .nutrient-target-bar-text").textContent);

    let data = {
        calories: parseMacroTarget(cal),
        protein: parseMacroTarget(protein),
        carbs: parseMacroTarget(carbs),
        fat: parseMacroTarget(fat),
    };

    await browser.close();

    return {
        data: data,
        freshLogin: freshLogin,
    }
}

function parseMacroTarget(string) {
    // examples: 
    //      '55.3 kcal  /  1850 kcal'
    //      '5.8 g  /  40.0 g'
    let comsummed = string.match(/\d+\.\d+ /)
    if (comsummed === null) {
        comsummed = string.match(/\d* /)
    }
    let norm = string.match(/ \d+\.\d+ /)
    if (norm === null) {
        norm = string.match(/ \d+ /)
    }

    return {consummed: parseFloat(comsummed), target: parseFloat(norm)}
}

function initCache() {
    if (fs.existsSync(cache._pathToFile)) {
        return
    }
    cache.setKey("cookie", JSON.stringify({}));
    cache.save(true);
}

const cache = flatCache.load("cache");
initCache();

const app = express();

app.use((req, res, next) => {
    if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
        res.status(401).json({error: 'unauthorised'});
    } else { 
        next();
    }
})

app.get("/data", async (req, res, next) => {
    scrapeData()
        .then((data) => {res.json(data); next();})
        .catch(() => {res.status(500)})
});
app.listen(PORT);
