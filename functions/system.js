const   mysql = require('promise-mysql'),
        { DBGet, DBSelector } = require('./connection'),
        { isN } = require('./common');


exports.ListDetail = async function(params=null){

    var response={ success:false };

    let whr=[],
        whrs='',
        fields='';

    if(!isN(params?.key)){ whr.push( `sisslctp_key='${params?.key}'` ); }
    if(!isN(whr)){ whrs = whr.join(' AND '); }

    let get = await DBGet({ query: `SELECT * FROM ${ DBSelector('VW_lists') } WHERE ${whrs}` });
    
    if(get){

        response.success = true;

        if(!isN(get)){

            response.ls={};

            Object.keys(get).forEach(function(key){

                var row = get[key],
                    key_ls = row.sisslctp_key,
                    key_f_ls = row.sisslctpf_key,
                    key_id = row.id_sisslc;
                        
                if(isN( response.ls[key_id] )){ response.ls[key_id]={}; }
                
                response.ls[key_id].id = key_id;
                response.ls[key_id].tt = row.sisslc_tt;
                response.ls[key_id].enc = row.sisslc_enc;
                response.ls[key_id].cns = row.sisslc_cns;

                if(!isN(key_f_ls)){
                    if(isN( response.ls[key_id][key_f_ls] )){ response.ls[key_id][key_f_ls]={}; }
                    response.ls[key_id][key_f_ls].id = row.id_sisslcf;
                    response.ls[key_id][key_f_ls].enc = row.sisslcf_enc;
                    response.ls[key_id][key_f_ls].vl = row.sisslcf_vl;
                }

            });

        }

    }else {
        response.error = 'No ID result';
    }

    return response;

};