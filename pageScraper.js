const scraperObject = {
	url: 'https://www.psychologytoday.com/us',
	async scraper(browser, category){
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		await page.goto(this.url);
			let selectedCategory = await page.$$eval('h6.teaser-lg__topic a', (links, _category) => {
				// Search for the element that has the matching text
				links = links.map(a => a.textContent.replace(/(\r\n\t|\n|\r|\t|^\s|\s$|\B\s|\s\B)/gm, "") === _category ? a : null);
				let link = links.filter(tx => tx !== null)[0];
				return link.href;
			}, category);
			// Navigate to the selected category
			await page.goto(selectedCategory);
		let scrapedData = [];
		async function scrapeCurrentPage() {
			await page.waitForSelector('.layout-content-main');
			let urls = await page.$$eval('div.teaser-listing-item article', links => {
				links = links.map(el => el.querySelector('h2 > a').href)
				return links;
			});
			
			// Loop through each of those links, open a new page instance and get the relevant data from them
			let pagePromise = (link) => new Promise(async(resolve, reject) => {
				let dataObj = {};
				let newPage = await browser.newPage();
				await newPage.goto(link);
				dataObj['articleCategory'] = await newPage.$eval('h6.blog-entry__topic--full a', text => text.textContent);
				dataObj['articleTitle'] = await newPage.$eval('h1.blog-entry__title--full', text => text.textContent);
				dataObj['articleAuthor'] = await newPage.$eval('.h3.profile-card__profile-name', text => text.textContent);
				dataObj['articleDescription'] = await newPage.$eval('.blog-entry--body', text => text.textContent);
				resolve(dataObj);
				await newPage.close();
			});

			for(link in urls){
				let currentPageData = await pagePromise(urls[link]);
				console.log(currentPageData);
			}
			let nextButtonExist = false;
			try{
				const nextButton = await page.$eval('.next > a', a => a.textContent);
				nextButtonExist = true;
			}
			catch(err){
				nextButtonExist = false;
			}
			if(nextButtonExist){
				await page.click('.next > a');	
				return scrapeCurrentPage(); // Call this function recursively
			}
			await page.close();
			return scrapedData;
		}
		let data = await scrapeCurrentPage();
		console.log(data);
		return data;
    }
}

module.exports = scraperObject; 