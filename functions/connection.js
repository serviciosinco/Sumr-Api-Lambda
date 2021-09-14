//const { Console } = require('console');
const mysql = require('promise-mysql');
const { isN /*, mySecrets */} = require('./common');

var CnxBusRd, CnxBusWrt;

const Connect = async(p=null)=>{

	var port;
	port = process.env.RDS_PORT ? process.env.RDS_PORT : 3306;

	if(	
		isN(CnxBusRd) || 
		isN(CnxBusWrt)
	){

		try{

			CnxBusRd = await mysql.createPool({
				database: 'sumr_bd',
				host: process.env.RDS_HOST,
				user: process.env.RDS_USERNAME,
				password: process.env.RDS_PASSWORD,
				port: port
			});

			CnxBusWrt = await mysql.createPool({
				database: 'sumr_bd',
				host: process.env.RDS_HOST_RD,
				user: process.env.RDS_USERNAME_RD,
				password: process.env.RDS_PASSWORD_RD,
				port: port
			});

			return true;

		}catch(e){

			console.error('Connect error:', e);

		}

	}else{

		console.error('No data for connection');

	}

};

exports.DBSelector = (v=null, d=null)=>{

	let r=null,
		db=process.env.DBM;

	if(!isN(d)){
		if(d=='d'){ db=process.env.DBD; }
		else if(d=='c'){ db=process.env.DBC; }
		else if(d=='t'){ db=process.env.DBT; }
		else if(d=='p'){ db=process.env.DBP; }
		else{ db=d; }
	}

	if(!isN(v)){
		if(v.indexOf('.') !== -1){ r=v; }else{ r=db+'.'+v; }
	}else{
		r='';
	}

	return r;
},

exports.DBClose = async function(p){
	//if(!isN(CnxBusRd)){ await CnxBusRd.end(); }
	//if(!isN(CnxBusWrt)){ await CnxBusWrt.end(); }
},

exports.DBGet = async function(p=null){

	if( !isN(p) && !isN(p.q) ){

		let svle = [];
		let rsp = {};
		var cnx;

		if(isN(CnxBusRd)){
			await Connect();
		}

		if(!isN(p.d)){ svle = p.d; }

		if(!isN(CnxBusRd)){
			try {
				cnx = await CnxBusRd.getConnection();
				
				if(!isN(p.d)){
					svle = p.d; 
					var qry = mysql.format(p.q, svle);
				}else{
					var qry = p.q;
				}

				let prc = await cnx.query(qry);
				if(prc){ rsp = prc; }
			}catch(ex){
				rsp.w = ex;
			}finally{
				await cnx.release();
			}
		}

		return rsp;

	}

};

exports.DBSave = async function(p=null){

	if( !isN(p) && !isN(p.q) ){

		let svle = [];
		let rsp = {e:'no'};
		var cnx;

		if(isN(CnxBusWrt)){
			await Connect();
		}

		if(!isN(CnxBusWrt)){

			try {

				cnx = await CnxBusWrt.getConnection();

				if(!isN(p.d)){
					svle = p.d; 
					var qry = mysql.format(p.q, svle);
				}else{
					var qry = p.q;
				}

				let prc = await cnx.query(qry);
				if(prc){ rsp = prc; }

			}catch(ex){
				await cnx.query("ROLLBACK");
				rsp.w = ex;
			}finally{
				await cnx.release();
			}

		}

		return rsp;

	}

};