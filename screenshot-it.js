const puppeteer = require('puppeteer');
const twit = require('twit');
const fs = require('fs')
const path = require('path')

const screenshotItCss = fs.readFileSync(path.resolve(__dirname, 'assets/css/screenshot-it.css'), 'utf8');
//const fontAwesomeCss = fs.readFileSync(path.resolve(__dirname, 'assets/css/font-awesome.min.css'), 'utf8');

const config = {
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret
}
const Twitter = new twit(config)
let params = {
	track: '@screenshot_it'
}
var stream = Twitter.stream('statuses/filter', params)
stream.on('tweet', function (tweet) {
	
	let mentionedTweetId  ;
	//console.log(tweet)
	//get the tweet information to extract parameters
	Twitter.get('statuses/show/:id', { id: tweet.id_str }, function(err, data, response) {
		if (!err) {
			mentionedTweetId = data.id_str;
		}
	})
	
	//get the tweet to convert to image information
	Twitter.get('statuses/show/:id', { id: tweet.in_reply_to_status_id_str }, function(err, data, response) {
		//console.log(data)
		if (!err) {
			let date = data.created_at //7:13 PM - 3 Jul 2018
			let tweetContent = data.text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');;
			let userName = data.user.name
			let userHandle = data.user.screen_name
			let userImage = data.user.profile_image_url_https
			let retweetCount = data.retweet_count
			let likeCount = data.favorite_count
			let isStatusQuoted = data.is_quote_status
			let tweetId = data.user.screen_name + data.id_str ;
			let tweetRealId = data.id_str ;
			let quotedStatusHTML = '';
			if (isStatusQuoted == 1) {
				let quotedStatusContent = data.quoted_status.text
				let quotedStatusUserName = data.quoted_status.user.name
				let quotedStatusUserHandle = data.quoted_status.user.screen_name
				let quotedStatusUserImage = data.quoted_status.user.profile_image_url_https
				quotedStatusHTML = `
					<div class="quoted-tweet">
						<div class="tweet-header">
							<div class="left">
								<img class="tweet-profile-img" src="` + quotedStatusUserImage + `" />
								<div class="tweet-name">
									<span class="name">` + quotedStatusUserName + `</span> <br/>
									<span class="handle-name">` + quotedStatusUserHandle + `</span>
								</div>
							</div>
						</div>
						<div class="tweet-content">
						` + quotedStatusContent + `
						</div>
					</div>
				`;
			}
			
			(async () => {
				//const browser = await puppeteer.launch({executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
				const browser = await puppeteer.launch();
				const page = await browser.newPage();
				await page.setContent( `<html style="padding: 0px;">
				<style> ` + screenshotItCss + ` </style> <!--<style> </style>-->
				<body>
					<div class="twitter-original" id="` + tweetId + ` " >
						<div class="tweet-header">
							<div class="left">
								<img class="tweet-profile-img" src="` + userImage + `" />
								<div class="tweet-name">
									<span class="name">` + userName + `</span> <br/>
									<span class="handle-name">` + userHandle + `</span>
								</div>
							</div>
							<div class="right">
								<a href=""><span class="watermark">@screenshot_it</span></a>
								<i class="fa fa-chevron-down arrow"></i>
							</div>
						</div>
						<div class="tweet-content">
						` + tweetContent + `
						</div>
						` + quotedStatusHTML + `
						<div class="date-time">` + date + `</div>
					</div>
				</body>
				</html>` );

				await page.waitForSelector('.twitter-original');
				async function screenshotDOMElement(selector, padding = 0) {
					const rect = await page.evaluate(selector => {
						const element = document.querySelector(selector);
						//console.log(element);
						const {x, y, width, height} = element.getBoundingClientRect();
						return {left: x, top: y, width, height, id: element.id};
					}, selector);

					//console.log('#' + tweetId);
					return await page.screenshot({
						//path: tweetId + '.png',
						clip: {
						  x: rect.left - padding,
						  y: rect.top - padding,
						  width: rect.width,
						  height: rect.height
						},
						encoding: 'base64'
				  });
				}

				let base64Image = await screenshotDOMElement('.twitter-original', 16); //console.log(base64Image);
				await browser.close();
				
				// post the image on the @screenshot_it account 
				Twitter.post('media/upload', { media_data: base64Image }, function (err, data, response) {
					var mediaIdStr = data.media_id_string
					var altText = " " + tweetId + " " + tweetContent 
					var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }					
					Twitter.post('media/metadata/create', meta_params, function (err, data, response) {
						if (!err) {
							var params = { 
								status: '@'+userHandle, 
								media_ids: [mediaIdStr], 
								in_reply_to_status_id: mentionedTweetId
							}		
							Twitter.post('statuses/update', params, function (err, data, response) {
								//console.log(data)
							})	
							var params1 = { 
								status: 'Tweet converted to image by @'+userHandle , 
								media_ids: [mediaIdStr]
							}
							Twitter.post('statuses/update', params1, function (err, data, response) {
								//console.log(data)
							})
						}
					 })
				})
			})();
			console.log("Successfully save image from tweet: " + tweetRealId);
		}
	})
})
