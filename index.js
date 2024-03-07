require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });
const bodyParser = require("body-parser");

const URLSchema = new mongoose.Schema({
	id: Number,
	url: String
});

let URLdb;
URLdb = mongoose.model('URLdb', URLSchema);

async function findLastRecord(){
	
	let record = await URLdb.find().sort({ '_id': -1 }).limit(1);
	console.log("RECORD LENGTH " + " " + record.length)
	if (record.length > 0){
		console.log('FINDRECORD ' + " " + record[0]['id'])
		return record;
	}
	else{
		return null;
	}
} 

async function saveRecord(id, url){
	let newUrlEntry = URLdb({id: id, url: url});
	try{
		await newUrlEntry.save();
		console.log("SAVING");
		return true;
	}
	catch(err){
		return err;
	}
}

async function getOriginalURL(idnumber){
	console.log('IDNUMBER ' + " " + idnumber)
	let urlfoundRecord = await URLdb.find({id:idnumber})
	if(urlfoundRecord){
		console.log("IDRECORD " + " " + urlfoundRecord[0]['id'] + " " + urlfoundRecord[0]['url'])
		return urlfoundRecord;
	}
	else{
		return null;
	}
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
	console.log("URL INPUT ", req.body.url);	

	let proceed = true;
	let domaintocheck;
	let regexTruth1 = true;
	let regexTruth2 = true;
	
	let urllink = String(req.body.url);
	let urlRegex = /https:\/\/www.|http:\/\/www./g;
	let urlRegex2 = /https:\/\/|http:\/\/./g;
	//console.log("REGEX TEST " + " " + urlRegex.test(urllink) + " " + typeof(urlRegex.test(urllink)))
	
	if(urlRegex.test(urllink) == false){
		//res.json({"error":"invalid URL"});
		regexTruth1 = false;
				
	}
	if (urlRegex2.test(urllink) == false){
		//res.json({"error":"invalid URL"});
		regexTruth2 = false;
	}
	
	if(regexTruth1 == false && regexTruth2 == false){
		console.log("BOTH FALSE");
		proceed = false;
		res.json({"error":"invalid URL"});
	}
	else{
		if(regexTruth1 == true){
			domaintocheck = urllink.replace(urlRegex,"").slice(0);
		}
		else{
			domaintocheck = urllink.replace(urlRegex2,"").slice(0);
		}
		let i;
		let count;
		count = 0;
		for(i=0; i<domaintocheck.length; i++){
			if(domaintocheck[i]==='.'){
				count = count + 1;
				if(count>=2){
					regexTruth1 = false;
					regexTruth2 = false;
					console.log("DOMAIN HAS MORE DOTS");
					//res.json({"error":"invalid URL"});
					break;

				}
			}
		}
		if(count >= 2){
			console.log("DOMAIN HAS DOTS ERROR GIVEN")
			proceed = false;
			res.json({"error":"invalid URL"});	
		}
	
	}
	
	/*console.log("BEFORE domain CHECK" + " " + domaintocheck);*/
	
	
	if (regexTruth1 == true || regexTruth2 == true) {
		console.log("INSIDE DOMAIN CHECK")
		//let  domaintocheck = urllink.replace(urlRegex,"").slice(0);
		//console.log("DOMAIN " + " " + urllink.replace(urlRegex,"").slice(0));
		dns.lookup(domaintocheck, (error, address, family)=>{
			if(error){
				console.log("DNS LOOKUP ERROR");
				proceed = false;
				res.json({"error":"invalid URL"});
			}
		})		
	}	
	
	if(proceed == true){
		let lastRecord = await findLastRecord();
		console.log("LAST RECORD " + " " + lastRecord);
		if (lastRecord == null){
			console.log("NO LAST RECORD")
			let hasEntrySaved = await saveRecord(Number(1), String(req.body.url));
			if(hasEntrySaved){
				res.json({original_url: req.body.url,short_url: Number(1)});
			}
		}
		else{
			console.log("THERE IS LAST RECORD")
			let hasEntrySaved = await saveRecord(Number(lastRecord[0]['id'])+1, String(req.body.url));
			if(hasEntrySaved){
				res.json({original_url: req.body.url,short_url: Number(lastRecord[0]['id'])+1});
			}
		}
	}
	
});

app.get("/api/shorturl/:number", async function(req, res) {
	console.log("NUBER PROVIDED " + " " + req.params['number'])
	
	let foundURLRecord = await getOriginalURL(Number(req.params['number']));
	if (foundURLRecord.length > 0){
		/*res.setHeader("Content-Type", "text/html")*/
		console.log("REDIRECT URL " + " " + foundURLRecord[0]["url"]);
		res.redirect(foundURLRecord[0]["url"]);
	}
});




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
