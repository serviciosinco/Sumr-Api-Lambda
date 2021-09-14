//const { Console } = require('console');
const mysql = require('promise-mysql');
const { isN /*, mySecrets */} = require('./common');

var CnxBusRd, CnxBusWrt;

const Connect = async(p=null)=>{

	var host,user,password,port;
	port = process.env.RDS_PORT ? process.env.RDS_PORT : 3306;

	if(	
		isN(CnxBusRd) || 
		isN(CnxBusWrt)
	){

		let PoolRd, PoolWrt;

		try{

			PoolRd = await mysql.createPool({
				database: 'sumr_bd',
				host: process.env.RDS_HOST,
				user: process.env.RDS_USERNAME,
				password: process.env.RDS_PASSWORD,
				port: port
			});

			PoolWrt = await mysql.createPool({
				database: 'sumr_bd',
				host: process.env.RDS_HOST_RD,
				user: process.env.RDS_USERNAME_RD,
				password: process.env.RDS_PASSWORD_RD,
				port: port
			});

			CnxBusRd = PoolRd.promise();
			CnxBusWrt = PoolWrt.promise();

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
	//CnxBus.end(error => error ? reject(error) : resolve());
	//await CnxBus.release();
	//await CnxBus.destroy();
},

exports.DBGet = async function(p=null){

	if( !isN(p) && !isN(p.q) ){

		let svle = [];
		let rsp = {};

		if(isN(CnxBusRd)){
			await Connect({ t:'rd' });
		}

		if(!isN(p.d)){ svle = p.d; }

		if(!isN(CnxBusRd)){
			try {
				let qry = mysql.format(p.q, svle);
				let prc = await CnxBusRd.query(qry);
				if(prc){ rsp = prc; }
			}catch(ex){
				rsp.w = ex;
			}finally{
				//await CnxBus.release();
				//await CnxBus.destroy();
			}
		}

		return rsp;

	}

};

exports.DBSave = async function(p=null){

	if( !isN(p) && !isN(p.q) ){

		let svle = [];
		let rsp = {e:'no'};

		if(isN(CnxBusWrt)){
			await Connect({t:'wrt'});
		}

		if(!isN(CnxBusWrt)){

			try {

				if(!isN(p.d)){
					svle = p.d; 
					var qry = mysql.format(p.q, svle);
				}else{
					var qry = p.q;
				}

				let prc = await CnxBusWrt.query(qry);
				if(prc){ rsp = prc; }

			}catch(ex){
				await CnxBusWrt.query("ROLLBACK");
				rsp.w = ex;
			}finally{
				//await CnxBus.release();
				//await CnxBus.destroy();
			}

		}

		return rsp;

	}

};