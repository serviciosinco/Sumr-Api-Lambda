var fs = require('fs'),
    mysql = require('promise-mysql'),
    SUMR_db = require('./db'),
    SUMR_f = require('./glbl');

var sis = {

    slc:{

        dt:async function(p=null){

            var rsp={e:'no'};

            let whr=[],
                whrs='',
                fld='';

            if(!SUMR_f.isN(p.key)){ whr.push( mysql.format('sisslctp_key=?', p.key) ); }
            if(!SUMR_f.isN(whr)){ whrs = whr.join(' AND '); }

            let get = await SUMR_db.get({ q: `SELECT * FROM `+SUMR_db.str('VW_lists')+` WHERE ${whrs}` });
           
            if(get){

                rsp.e = 'ok';

                if(!SUMR_f.isN(get)){

                    rsp.ls={};

                    Object.keys(get).forEach(function(key){

                        var row = get[key];
                        var key_ls = row.sisslctp_key; 
						var key_f_ls = row.sisslctpf_key;
                        var key_id = row.id_sisslc;
                                
                        if(SUMR_f.isN( rsp.ls[key_id] )){ rsp.ls[key_id]={}; }
                        
                        rsp.ls[key_id].id = key_id;
                        rsp.ls[key_id].tt = row.sisslc_tt;
                        rsp.ls[key_id].enc = row.sisslc_enc;
                        rsp.ls[key_id].cns = row.sisslc_cns;

                        if(!SUMR_f.isN(key_f_ls)){
                            if(SUMR_f.isN( rsp.ls[key_id][key_f_ls] )){ rsp.ls[key_id][key_f_ls]={}; }
                            rsp.ls[key_id][key_f_ls].id = row.id_sisslcf;
                            rsp.ls[key_id][key_f_ls].enc = row.sisslcf_enc;
                            rsp.ls[key_id][key_f_ls].vl = row.sisslcf_vl;

                        }

                    });

                }

            }else {
                rsp['w'] = 'No ID result';
            }

            return rsp;

        }

    }

};    

module.exports = sis;