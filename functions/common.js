exports.isN = (p)=>{
	try{
		if(p==undefined || p==null || p==''){ return true;}else{return false;}
	}catch(err) {
		console.info(err.message);
		console.log(err);
	}
};

exports.Path = (p,n)=>{
	try{
		if(!this.isN(p)){
			var path = p.split('/');
			if(!this.isN( path[n] )){ return path[n]; }
		}
	}catch(err) {
		console.info(err.message);
		console.log(err);
	}
};


exports.AwsDeviceId = (device)=>{
	
	var id = '';

	if(device == 'mobile'){
		id = process.env.ID_SISDSP_MVL
	}else if(device == 'tablet'){
		id = process.env.ID_SISDSP_TBLT
	}else if(device == 'desktop'){
		id = process.env.ID_SISDSP_DSKTP
	}else{
		id = process.env.ID_SISDSP_DSKTP; 
	}

	return id;
}

exports.getTimefromISO = (d)=>{

	let data = {};
	let date_ob = new Date( d );
	let date = ('0' + date_ob.getDate()).slice(-2);
	let month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let hours = ('0' + date_ob.getHours()).slice(-2);
	let minutes = ('0' + date_ob.getMinutes() ).slice(-2);
	let seconds = ('0' + date_ob.getSeconds() ).slice(-2);

	data = {
		e:'ok',
		d:{
			date:year+'-'+month+'-'+date,
			time:hours+':'+minutes+':'+seconds,
			dayn:date_ob.getDay() == 0 ? 7 : date_ob.getDay(),
			fullyear:year+'-'+month+'-'+date+' '+hours+':'+minutes+':'+seconds
		}
	}

	return data;
}

exports.TimeNow = ()=>{

	let data = {};
	let date_ob = new Date();
	let date = ('0' + date_ob.getDate()).slice(-2);
	let month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let hours = ('0' + date_ob.getHours()).slice(-2);
	let minutes = ('0' + date_ob.getMinutes() ).slice(-2);
	let seconds = ('0' + date_ob.getSeconds() ).slice(-2);

	data = {
		e:'ok',
		d:{
			date:year+'-'+month+'-'+date,
			time:hours+':'+minutes+':'+seconds,
			dayn:date_ob.getDay() == 0 ? 7 : date_ob.getDay(),
			fullyear:year+'-'+month+'-'+date+' '+hours+':'+minutes+':'+seconds
		}
	}

	return data;

};

/*
exports.mySecrets = async(keyname)=>{

	var AWS = require('aws-sdk'),
		region = "us-east-1",
		secretName = keyname;

	var client = new AWS.SecretsManager({
		region: region
	});

	try {

		const data = await client.getSecretValue({ SecretId: secretName }).promise();

		if (data) {

			if (data.SecretString) {
				const secret = data.SecretString;
				const parsedSecret = JSON.parse(secret);
				return parsedSecret;
			}

			const binarySecretData = data.SecretBinary;
			return binarySecretData;

		}

	} catch (error) {

	  return {
		data: null,
		error: error
	  };

	}

};
*/