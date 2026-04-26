const puppeteer = require('puppeteer');
const http = require('http');

let latestBalance = 'Loading...';

async function getBalance() {
  const browser = await puppeteer.launch({ 
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
});
  const page = await browser.newPage();
  
  await page.goto('https://khata.pe/t/vFoUcsXOjc?s=tbs', { 
    waitUntil: 'networkidle2' 
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));
    let amounts = [];
    let drCrs = [];

    allElements.forEach(el => {
      const text = el.innerText?.trim();
      if (text === 'Dr' || text === 'Cr' || text === 'DR' || text === 'CR') drCrs.push(text);
      if (text && text.match(/^[\d,]+(\.\d{1,2})?$/) && el.children.length === 0) amounts.push(text);
    });

    const balances = amounts.filter((_, i) => i % 2 !== 0);
    return { balance: balances[0], drCr: drCrs[0] };
  });

  latestBalance = `${result.drCr} ${result.balance}`;
  const time = new Date().toLocaleString();
  console.log(`[${time}] Balance: ${latestBalance}`);
  
  await browser.close();
}

// Server
http.createServer((req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'text/plain',
    'ngrok-skip-browser-warning': 'true'
  });
  res.end(latestBalance);
}).listen(3000, () => console.log('Server running on port 3000'));

// Run immediately then every 5 minutes
getBalance();
setInterval(getBalance, 5 * 60 * 1000);
