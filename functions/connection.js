//const { Console } = require('console');
const mysql = require('mysql2');
const { isN /*, mySecrets */} = require('./common');

var Connection,
	ConnectionsPool,
	ConnectionType;

const Connect = async(p=null)=>{

	var host,user,password,port;

	if(	!isN(p) &&
		!isN(p.t) &&
		p.t == 'wrt'
	){
		host = process.env.RDS_HOST;
		user = process.env.RDS_USERNAME;
		password = process.env.RDS_PASSWORD;
	}else{
		host = process.env.RDS_HOST_RD;
		user = process.env.RDS_USERNAME_RD;
		password = process.env.RDS_PASSWORD_RD;
	}

	port = process.env.RDS_PORT ? process.env.RDS_PORT : 3306;

	if(	!isN(p) &&
		!isN(p.t) &&
		!isN(host) &&
		!isN(user) &&
		!isN(password)
	){

		let stng,
			pool,
			cnx;

		try{

			stng = {
				database: 'sumr_bd',
				host: host,
				user: user,
				password: password,
				port: port,
				connectionLimit : 1000,
				connectTimeout  : 60 * 60 * 1000,
				acquireTimeout  : 60 * 60 * 1000,
				timeout         : 60 * 60 * 1000
			};

			ConnectionType = p.t;
			pool = await mysql.createPool(stng);
			ConnectionsPool = pool.promise();
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
	//Connection.end(error => error ? reject(error) : resolve());
	await Connection.release();
	await Connection.destroy();
},

exports.DBGet = async function(p=null){

	if( !isN(p) && !isN(p.q) ){

		let svle = [];
		let rsp = {};

		if(isN(Connection) || ConnectionType == 'wrt'){
			Connection = await Connect({ t:'rd' });
		}

		if(!isN(p.d)){ svle = p.d; }

		if(!isN(Connection)){
			try {
				let qry = mysql.format(p.q, svle);
				let prc = await Connection.query(qry);
				if(prc){ rsp = prc; }
			}catch(ex){
				rsp.w = ex;
			}finally{
				//await Connection.release();
				//await Connection.destroy();
			}
		}

		return rsp;

	}

};

exports.DBSave = async function(p=null){

	if( !isN(p) && !isN(p.q) ){

		let svle = [];
		let rsp = {e:'no'};

		if(isN(Connection) || ConnectionType == 'rd'){
			Connection = await Connect({t:'wrt'});
		}

		if(!isN(Connection)){

			try {

				if(!isN(p.d)){
					svle = p.d; 
					var qry = mysql.format(p.q, svle);
				}else{
					var qry = p.q;
				}

				let prc = await Connection.query(qry);
				if(prc){ rsp = prc; }

			}catch(ex){
				await Connection.query("ROLLBACK");
				rsp.w = ex;
			}finally{
				//await Connection.release();
				//await Connection.destroy();
			}

		}

		return rsp;

	}

};