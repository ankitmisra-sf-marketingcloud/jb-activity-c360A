"use strict";

const Path = require("path");
const Pkg = require(Path.join(__dirname, "..", "package.json"));
const express = require("express");

// Helper utility for verifying and decoding the jwt sent from Salesforce Marketing Cloud.
const verifyJwt = require(Path.join(__dirname, "lib", "jwt.js"));

const app = express();
const fs = require("fs");
const jsonPath = Path.join(__dirname, "lib", "jsonObject.json");
const fetch = require("node-fetch");
const fsx = require('fs-extra');
var bodyParser = require('body-parser');


//Register middleware that parses the request payload.
app.use(
	bodyParser.raw({
		type: "application/jwt"
	})
);
app.use(bodyParser.json())


let jsonParse = (bodyParser.json());

app.post("/activity/saveurl", jsonParse, (req, res) => {
	var jsonobject = req.body.url;
	fsx.ensureFileSync(jsonPath);
	fetch(jsonobject, {
			headers: {
				method: "GET",
				dataType: "jsonp",
				Accept: "jsonp",
				crossDomain: "true",
				jsonp: false
			}
		})
		.then(function (response) {
			console.log(response);
			return response.json();
		})
		.then(function (objt) {
			console.log("storage start");

			let rawdata = JSON.stringify(objt);
			fs.writeFileSync(jsonPath, rawdata);
			console.log("storage end");

		})
	return res.status(200).json({
		uPath: jsonobject,
		data: fs.readFileSync(jsonPath)
	});
});

function getSegment(marketingCloudId) {
	let data = fs.readFileSync(jsonPath);
	let obj = JSON.parse(data);
	for (var i = 0; i < Object.keys(obj.content).length; i++) {
		if (obj.content[i].CUSTOMER_INDID === marketingCloudId) {
			return obj.content[i].segmentValue;
		}
	}
}

// Route that is called for every contact who reaches the custom split activity
app.post("/activity/execute", (req, res) => {
	verifyJwt(
		req.body,
		Pkg.options.salesforce.marketingCloud.jwtSecret,
		(err, decoded) => {
			// verification error -> unauthorized request
			if (err) {
				console.error(err);
				return res.status(401).end();
			}
			
			try {
					if  (fs.existsSync(jsonPath)) {
              			  console.log("File exists");
						if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
						console.log(JSON.stringify(decoded.inArguments));
						let marketingCloudId;
						var decodedArgs = decoded.inArguments[0];
						marketingCloudId = decodedArgs.customerKey;
						var segValue = getSegment(marketingCloudId);

						switch (segValue) {
						case "veryLikely":
							return res.status(200).json({
							branchResult: "verylikely"
							});
							break;
						case "likely":
							return res.status(200).json({
							branchResult: "likely"
							});
							break;
						case "neutral":
							return res.status(200).json({
							branchResult: "neutral"
							});
							break;
						default:
							return res.status(200).json({
							branchResult: "unlikely"
							});
						}
					} else {
						return res.status(200).json({
						branchResult: "unlikely"
						});
					}
					
		  
				} else {
					console.error("inArguments invalid.");
					return res.status(400).end();
				}	
			
		}
				catch (err) {
					console.log(err)
				}
				
			} 
	);
});

// Routes for saving, publishing and validating the custom activity. In this case
// nothing is done except decoding the jwt and replying with a success message.
app.post(/\/activity\/(save|publish|validate)/, (req, res) => {
	verifyJwt(
		req.body,
		Pkg.options.salesforce.marketingCloud.jwtSecret,
		(err, decoded) => {
			// verification error -> unauthorized request
			if (err) return res.status(401).end();

			return res.status(200).json({
				success: true
			});
		}
	);
});

// Serve the custom activity's interface, config, etc.
app.use(express.static(Path.join(__dirname, "..", "public")));

// Start the server and listen on the port specified by heroku or defaulting to 12345
app.listen(process.env.PORT || 12345, () => {
	console.log("Hux Intelligent customsplit backend is now running!");
});