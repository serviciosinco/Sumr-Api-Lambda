const { Console } = require('console');
var fs = require('fs'),
    mysql = require('promise-mysql'),
    SUMR_f = require('./glbl');

var db = {

    cnct:async(p=null)=>{

		var host,user,password,port;

		if(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'developer'){

			host = process.env.RDS_HOST;
            user = process.env.RDS_USERNAME;
            password = process.env.RDS_PASSWORD;
			port = process.env.RDS_PORT ? process.env.RDS_PORT : 3306;

		}else{

			let sm_type = process.env.RDS_SM_READ;
			if(p.t == 'wrt'){ sm_type = process.env.RDS_SM_WRTE;}
			let sm_data = await SUMR_f.mySecrets( sm_type );

			if(	!SUMR_f.isN(sm_data)){
				host = sm_data.host;
				port = sm_data.port;
				user = sm_data.username;
				password = sm_data.password ? sm_data.password : 3306;
			}

		}

        if(	!SUMR_f.isN(p) &&
            !SUMR_f.isN(p.t) &&
            !SUMR_f.isN(host) &&
            !SUMR_f.isN(user) &&
            !SUMR_f.isN(password)
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
					connectionLimit: 10,
				};

                pool = await mysql.createPool(stng);
                cnx = pool.getConnection();
                return cnx;

            }catch(e){

				console.error('cnct error:', e);

            }

        }else{

			console.error('No data for connection');

        }

    },

    str:function(v=null, d=null){

        let r=null,
            db=process.env.DBM;

        if(!SUMR_f.isN(d)){
            if(d=='d'){ db=process.env.DBD; }
            else if(d=='c'){ db=process.env.DBC; }
            else if(d=='t'){ db=process.env.DBT; }
            else if(d=='p'){ db=process.env.DBP; }
            else{ db=d; }
        }

		if(!SUMR_f.isN(v)){
			if(v.indexOf('.') !== -1){ r=v; }else{ r=db+'.'+v; }
		}else{
			r='';
        }

		return r;
	},

    cls: async function(p){
        this.cnx.end(function(){
            //console.log(' Conexion cerrada \n\n');
        });
    },

    get:async function(p=null){

        if( !SUMR_f.isN(p) && !SUMR_f.isN(p.q) ){

            let svle = [];
            let rsp = {};
            let cnx = await this.cnct({ t:'rd' });

            if(!SUMR_f.isN(p.d)){ svle = p.d; }

			if(!SUMR_f.isN(cnx)){
				try {

					let qry = mysql.format(p.q, svle);
					let prc = await cnx.query(qry);

					if(prc){ rsp = prc; }

				}catch(ex){
					await cnx.query("ROLLBACK");
					rsp.w = ex;
				}finally{
					await cnx.release();
					await cnx.destroy();
				}
			}

            return rsp;

        }

    },
    save: async function(p=null){

        if( !SUMR_f.isN(p) && !SUMR_f.isN(p.q) ){

            let svle = [];
            let rsp = {e:'no'};
            let cnx = await this.cnct({t:'wrt'});

			if(!SUMR_f.isN(cnx)){

				try {

					if(!SUMR_f.isN(p.d)){ svle = p.d; }
					let qry = mysql.format(p.q, svle);
					let prc = await cnx.query(qry);
					if(prc){ rsp = prc; }

				}catch(ex){
					await cnx.query("ROLLBACK");
					rsp.w = ex;
				}finally{
					await cnx.release();
					await cnx.destroy();
				}

			}

            return rsp;

        }

    }

}


module.exports = db;