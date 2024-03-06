require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
var dns = require("dns");
const app = express();

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



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

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
	let urllink = String(req.body.url);
	let urlRegex = /https:\/\/www.|http:\/\/www./g;
	let  domaintocheck = urllink.replace(urlRegex,"").slice(0);
	console.log("DOMAIN " + " " + urllink.replace(urlRegex,"").slice(0));
	dns.lookup(domaintocheck, (error, address, family)=>{
		if(error){
			res.json({"error":"invalid URL"});
		}
	})
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
});


app.get("/api/shorturl/:number", async function(req, res) {
	let foundURLRecord = await getOriginalURL(Number(req.params['number']));
	if (foundURLRecord){
		res.setHeader("Content-Type", "text/html")
		console.log("REDIRECT URL " + " " + foundURLRecord[0]["url"]);
		res.redirect(foundURLRecord[0]["url"]);
	}
});




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
