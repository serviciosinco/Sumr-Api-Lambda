//const { Console } = require('console');
const mysql = require('promise-mysql');
const { isN /*, mySecrets */} = require('./common');

var CnxBusRd, CnxBusWrt;

const Connect = async(param=null)=>{

	var response = {},
		port = process.env.RDS_PORT ? process.env.RDS_PORT : 3306;

	if(	!CnxBusRd || !CnxBusWrt ){

		try{

			if(param?.read){

				CnxBusRd = await mysql.createPool({
					database: 'sumr_bd',
					host: process.env.RDS_PRVT_HOST_RD ? process.env.RDS_PRVT_HOST_RD : process.env.RDS_HOST_RD,
					user: process.env.RDS_USERNAME_RD,
					password: process.env.RDS_PASSWORD_RD,
					port: port,
					connectionLimit: 10
				});

				if(CnxBusRd){ response.read = true; }

			}

			if(param?.write){

				CnxBusWrt = await mysql.createPool({
					database: 'sumr_bd',
					host: process.env.RDS_PRVT_HOST ? process.env.RDS_PRVT_HOST : process.env.RDS_HOST,
					user: process.env.RDS_USERNAME,
					password: process.env.RDS_PASSWORD,
					port: port,
					connectionLimit: 10
				});

				if(CnxBusRd){ response.write = true; }
			}

			return true;

		}catch(e){

			console.error('Connect error:', e);

		}

	}else{

		console.error('No data for connection');

	}

	return response;

};

exports.DBAccount = (account=null)=>{
	let response = null;
	if(account) response = 'sumr_c_'+account;
	return response;
};

exports.DBSelector = (table=null, options=null)=>{

	let response = null,
		database = process.env.DBM;

	if(options?.db){
		if(options.db=='d'){ database=process.env.DBD; }
		else if(options.db=='c'){ database=process.env.DBC; }
		else if(options.db=='t'){ database=process.env.DBT; }
		else if(options.db=='p'){ database=process.env.DBP; }
		else{ database=options.db; }
	}else if(options?.account){
		database = this.DBAccount(options?.account);
	}

	if(table && database){
		if(table.indexOf('.') !== -1){ response=table; }else{ response=database+'.'+table; }
	}else{
		response='';
	}

	return response;
};

exports.DBClose = async function(p){
	if(!CnxBusRd){ await CnxBusRd.end(); }
	if(!CnxBusWrt){ await CnxBusWrt.end(); }
};

exports.DBGet = async function(param=null){

	var data_format = [],
		response = {},
		query = '',
		conexDB,
		conexPool;

	if( param?.query ){

		if(!CnxBusRd){
			conexDB = await Connect({ read:true });
		}

		if(param?.data){ data_format = param?.data; }

		if(CnxBusRd){

			try {

				conexPool = await CnxBusRd.getConnection();
				
				if(param?.data){
					data_format = param?.data; 
					query = mysql.format(param?.query, data_format);
				}else{
					query = param?.query;
				}

				const result = await conexPool.query(query);
				if(result){ response = result; }

			}catch(ex){
				response.error = ex;
			}finally{
				if(conexPool){ 
					//console.log('Release connection to:' + ( process.env.RDS_PRVT_HOST_RD ? process.env.RDS_PRVT_HOST_RD : process.env.RDS_HOST ) ); 
					await conexPool.release(); 
				}
			}

		}else{

			response.error = `No read connection`;

		}

	}else{

		response.error = `No query for execute`;

	}

	return response;

};

exports.DBSave = async function(param=null){

	var data_format = [],
		response = {},
		query = '',
		conexDB,
		conexPool;

	if( param?.query ){

		if(!CnxBusWrt){
			console.log('No Pool Connection, So Create One');
			conexDB = await Connect({ write:true });
		}

		if(CnxBusWrt){

			try {

				conexPool = await CnxBusWrt.getConnection();

				if(param?.data){
					data_format = param?.data; 
					query = mysql.format(param?.query, data_format);
				}else{
					query = param?.query;
				}

				const result = await conexPool.query(query);
				if(result){ response = result; }

			}catch(ex){
				await conexPool.query("ROLLBACK");
				response.error = ex;
			}finally{
				if(conexPool){ await conexPool.release(); }
			}

		}else{
		
			response.error = `No CnxBusWrt connection`;
			
		}	

	}else{
		
		response.error = `No query string`;
		
	}

	return response;

};


exports.DBSleep = (time=2000)=>{
	return new Promise((resolve) => setTimeout(resolve, time));
}