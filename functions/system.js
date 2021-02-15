const   mysql = require('promise-mysql'),
        { DBGet, DBSelector } = require('./connection'),
        { isN } = require('./common');


exports.ListDetail = async function(p=null){

    var rsp={e:'no'};

    let whr=[],
        whrs='',
        fld='';

    if(!isN(p.key)){ whr.push( mysql.format('sisslctp_key=?', p.key) ); }
    if(!isN(whr)){ whrs = whr.join(' AND '); }

    let get = await DBGet({ q: `SELECT * FROM `+DBSelector('VW_lists')+` WHERE ${whrs}` });
    
    if(get){

        rsp.e = 'ok';

        if(!isN(get)){

            rsp.ls={};

            Object.keys(get).forEach(function(key){

                var row = get[key],
                    key_ls = row.sisslctp_key,
                    key_f_ls = row.sisslctpf_key,
                    key_id = row.id_sisslc;
                        
                if(isN( rsp.ls[key_id] )){ rsp.ls[key_id]={}; }
                
                rsp.ls[key_id].id = key_id;
                rsp.ls[key_id].tt = row.sisslc_tt;
                rsp.ls[key_id].enc = row.sisslc_enc;
                rsp.ls[key_id].cns = row.sisslc_cns;

                if(!isN(key_f_ls)){
                    if(isN( rsp.ls[key_id][key_f_ls] )){ rsp.ls[key_id][key_f_ls]={}; }
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

};