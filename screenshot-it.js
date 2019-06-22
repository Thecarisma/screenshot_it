const puppeteer = require('puppeteer');
const twit = require('twit');
const fs = require('fs')
const path = require('path')
const util = require("./util.js");

const screenshotItCss = fs.readFileSync(path.resolve(__dirname, 'assets/css/screenshot-it.css'), 'utf8');
const fontAwesomeJS = fs.readFileSync(path.resolve(__dirname, 'assets/js/font-awesome.js'), 'utf8');

const config = {
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret,
  tweet_mode: 'extended'
}
const Twitter = new twit(config)
let params = {
	track: '@screenshot_it'
}
var stream = Twitter.stream('statuses/filter', params)
stream.on('tweet', function (tweet) {
	
	let mentionedTweetId  ;
	let requestHandle ;
	let darkTheme = " theme-dark" ;
	let noStat = 0 ;
	//get the tweet information to extract parameters
	Twitter.get('statuses/show/:id', { id: tweet.id_str, tweet_mode: 'extended'  }, function(err, data, response) {
		if (!err) {
			mentionedTweetId = data.id_str;
			requestHandle = data.user.screen_name;
			let requestTweetContent = (data.full_text ? data.full_text : data.text).replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\n/g, "<br />");
			if (requestTweetContent.indexOf('light') > -1) { darkTheme = "" ; }
			if (requestTweetContent.indexOf('nostat') > -1) { noStat = 1 ; }
		}
	})
	
	//get the tweet to convert to image information
	Twitter.get('statuses/show/:id', { id: tweet.in_reply_to_status_id_str, tweet_mode: 'extended' }, function(err, data, response) {
		//console.log(data)
		if (!err) {
			let date = util.formatTwitterDate(data.created_at); //7:13 PM - 3 Jul 2018
			let tweetContent = (data.full_text ? data.full_text : data.text).replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\n/g, "<br />");
			let userName = data.user.name
			let userHandle = data.user.screen_name
			let userImage = data.user.profile_image_url_https
			let retweetCount = data.retweet_count
			let likeCount = data.favorite_count
			let isStatusQuoted = data.is_quote_status
			let tweetId = data.user.screen_name + data.id_str ;
			let tweetRealId = data.id_str ;
			let mediaHTML = '';
			let quotedStatusHTML = '';
			let tweetStat = '' ;
			if (noStat == 0) {
				tweetStat = `
				<div class="stats">
					<div class="stat">
						<span class="count">`+retweetCount+`</span> Retweets
					</div>
					<div class="stat">
						<span class="count">`+likeCount+`</span> Likes
					</div>
				</div>
				`;
			}
			if (data.extended_entities) {
				let count = data.extended_entities.media.length;
				//console.log(data.extended_entities);
				if (count == 1) {
					mediaHTML += `<div class="media">
									<img class="one-img" src="` + data.extended_entities.media[0].media_url_https + `" 
										alt="` + data.extended_entities.media[0].id_str + `" />
								</div>` ;
				} else if ( count == 2) {
					mediaHTML += `<div class="media two">
									<img class="two-img" src="` + data.extended_entities.media[0].media_url_https + `" 
											alt="` + data.extended_entities.media[0].id_str + `" />
									<img class="two-img" src="` + data.extended_entities.media[1].media_url_https + `" 
											alt="` + data.extended_entities.media[1].id_str + `" />
								</div>` ;
				} else if ( count == 3) {
					mediaHTML += `<div class="media">
									<img class="side-one" src="` + data.extended_entities.media[0].media_url_https + `" 
											alt="` + data.extended_entities.media[0].id_str + `" />
									<div class="side-two" >
										<img src="` + data.extended_entities.media[1].media_url_https + `" 
											alt="` + data.extended_entities.media[1].id_str + `" />
											
										<img src="` + data.extended_entities.media[2].media_url_https + `" 
											alt="` + data.extended_entities.media[2].id_str + `" />
									</div>
								</div>` ;
				} else if ( count == 4) {
					mediaHTML += `<div class="media">
									<img class="side-one" src="` + data.extended_entities.media[0].media_url_https + `" 
											alt="` + data.extended_entities.media[0].id_str + `" />
									<div class="side-two-3" >
										<img src="` + data.extended_entities.media[1].media_url_https + `" 
											alt="` + data.extended_entities.media[1].id_str + `" />
											
										<img src="` + data.extended_entities.media[2].media_url_https + `" 
											alt="` + data.extended_entities.media[2].id_str + `" />
											
										<img src="` + data.extended_entities.media[3].media_url_https + `" 
											alt="` + data.extended_entities.media[3].id_str + `" />
									</div>
								</div>` ;
				}
			}
			if (isStatusQuoted == 1) {
				let quotedStatusContent = (data.quoted_status.full_text ? data.quoted_status.full_text : data.quoted_status.text).replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\n/g, "<br />")
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
				const browser = await puppeteer.launch({ headless: true, args:['--no-sandbox', '--disable-setuid-sandbox'] })
				const page = await browser.newPage();
				await page.setContent( `<html style="padding: 0px;">
				<style> ` + screenshotItCss + ` </style> 
				<body>
					<div class="twitter-original`+darkTheme+`" id="` + tweetId + ` " >
						<div class="tweet-header">
							<div class="left">
								<img class="tweet-profile-img" src="` + userImage + `" />
								<div class="tweet-name">
									<span class="name">` + userName + `</span> <br/>
									<span class="handle-name">` + userHandle + `</span>
								</div>
							</div>
							<div class="right">
								<a href=""><span class="watermark">` + requestHandle + `</span></a>
							</div>
						</div>
						<div class="tweet-content">
						` + tweetContent + `
						</div>
						` + mediaHTML+ `
						` + quotedStatusHTML + `
						<div class="date-time">` + date + ` - @screenshot_it</div>
						`+ tweetStat +`
					</div>
				</body>
				</html>` );

				await page.waitForSelector('.tweet-content');
				async function screenshotDOMElement(selector, padding = 0) {
					const rect = await page.evaluate(selector => {
						const element = document.querySelector(selector);
						//console.log(element);
						const {x, y, width, height} = element.getBoundingClientRect();
						return {left: x, top: y, width, height, id: element.id};
					}, selector);

					//console.log('#' + tweetId + '-' + userHandle);
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
								status: 'Hi @'+requestHandle + ' the tweet has been converted to an image, you can save the image below', 
								media_ids: [mediaIdStr], 
								in_reply_to_status_id: mentionedTweetId
							}		
							Twitter.post('statuses/update', params, function (err, data, response) {
								//console.log(data)
							})
							console.log("Successfully generated image from tweet: " + tweetRealId);
						}
					 })
				});
			})();
		}
	})
})
