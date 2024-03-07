require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
var dns = require("dns");
const app = express();



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
const bodyParser = require("body-parser");

let urlDataArray = []; 

async function getLastElement(){
    if (urlDataArray.length == 0){
        return null;
    }
    else{
        return urlDataArray[urlDataArray.length-1];
    }
}

async function pushElement(url, id){
    urlDataArray.push({id: Number(id), url: String(url)});
	return true;
}

async function getOriginalUrl(idnumber){
	let i;
	for(i=0; i<urlDataArray.length; i++){
		if(urlDataArray[i]['id'] == Number(idnumber)){
			return urlDataArray[i];
		}
	}
	return null;
}

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({extended: true}));

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});



app.post("/api/shorturl", async function(req, res){
	let domainstripped;
	let urllink = String(req.body.url);
	let urlRegex = /https:\/\/www.|http:\/\/www./g;
	let urlRegex2 = /https:\/\/|http:\/\/./g;
	
	if(urlRegex.test(urllink) === false && urlRegex2.test(urllink) === false){
		res.json({error:"invalid url"});
	}
	else if(urlRegex.test(urllink) === true){
		domainstripped = urllink.replace(urlRegex,"").slice(0);
	}
	else if(urlRegex2.test(urllink) === true){
		domainstripped = urllink.replace(urlRegex2,"").slice(0);
	}
	
	let lastElement = await getLastElement();
	console.log("LAST Element " + " " + lastElement);
	if (lastElement == null){
		console.log("NO LAST Element")
		let hasEntrySaved = await pushElement(String(req.body.url), Number(1));
		if(hasEntrySaved === true){
			res.json({original_url: req.body.url,short_url: Number(1)});
		}
	}
	else{
		console.log("THERE IS LAST ELEMENT")
		let hasEntrySaved = await pushElement(String(req.body.url), Number(lastElement['id'])+1);
		if(hasEntrySaved === true){
			res.json({original_url: req.body.url,short_url: Number(lastElement['id'])+1});
		}
	}
});



app.get("/api/shorturl/:number", async function(req, res) {
	console.log("NUBER PROVIDED " + " " + req.params['number'])
	
	
	if (req.params['number'] != undefined){
		let foundURLElement = await getOriginalUrl(Number(req.params['number']));
		console.log("FOUNDURL " + " " + foundURLElement);
		if (foundURLElement != null){
			//res.setHeader("Content-Type", "text/html")
			console.log("REDIRECT URL " + " " + foundURLElement["url"]);
			res.redirect(foundURLElement["url"]);
		}
	}
});




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});