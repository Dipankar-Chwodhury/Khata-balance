const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v110.0.0/chromium-v110.0.0-pack.tar'
      ),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto('https://khata.pe/t/vFoUcsXOjc?s=tbs', {
      waitUntil: 'networkidle2',
      timeout: 25000
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      let amounts = [];
      let drCrs = [];

      allElements.forEach(el => {
        const text = el.innerText?.trim();
        if (text === 'Dr' || text === 'Cr') drCrs.push(text);
        if (text && text.match(/^[\d,]+(\.\d{1,2})?$/) && el.children.length === 0) amounts.push(text);
      });

      const balances = amounts.filter((_, i) => i % 2 !== 0);
      return { balance: balances[0], drCr: drCrs[0] };
    });

    await browser.close();
    res.status(200).send(`${result.drCr} ${result.balance}`);

  } catch (err) {
    res.status(200).send('Error: ' + err.message);
  }
};
