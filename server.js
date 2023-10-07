"use strict";

const express = require("express")
const fs = require("fs");
require('dotenv').config()

const API_KEY = process.env.API_KEY
const PORT = process.env.PORT || 50901;

const app = express();

app.use((req, res, next) => {
    if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
        res.status(401).json({error: 'unauthorised'});
    } else { 
        next();
    }
})

app.get("/data", async (req, res, next) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    res.json(data);
    next();
});
app.listen(PORT);
