const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];

var redis = require("redis"),
	client = redis.createClient("redis://redis:6379/0");

client.on("error", function (err) {
	console.log("Redis Error " + err);
	process.exit(1);
});

var url = "" + process.argv.slice(2);
var pathSeed = Math.floor(Math.random() * 10000000);

(async () => {
	const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto(url);
	await page.emulate(iPhone);
	let screenshot = await page.screenshot({encoding: "base64"});
	client.set(pathSeed, screenshot);
	const hrefs = await page.$$eval('a', as => as.map(a => a.href));
	function getBoxes(a){
		let i = 0;
		let arr = [];
		for(i = 0; i < a.length; i++) {
			arr.push(["url", a[i].href,"top",a[i].getBoundingClientRect().top, "left", a[i].getBoundingClientRect().left, "right", a[i].getBoundingClientRect().right,"bottom",a[i].getBoundingClientRect().bottom]);
		}
		return arr;
	}
	const hbb = await page.$$eval('a', getBoxes);
	for(let i = 0; i < hbb.length; i++){
		client.hmset(pathSeed + ":" + i, hbb[i]);
	}
	var pageTitle = await page.title();
	await browser.close();
	client.quit();

	console.log(pathSeed + " " + pageTitle);
})().catch((error) => {
        console.error("Puppeteer " + error);
	process.exit(1);
});
