const { DBGet, DBSelector } = require('./connection');

exports.CustomerDetail = async function(p=null){

    let fld='',
        rsp={e:'no'};

    if(p.t == 'enc'){ fld = 'cl_enc'; }
    else if(p.t == 'sbd'){ fld = 'cl_sbd'; }
    else{ fld = 'id_cl'; }

    let get = await DBGet({
                        q: `SELECT id_cl, cl_enc, cl_sbd FROM `+DBSelector('_cl')+` WHERE ${fld}=? LIMIT 1`,
                        d:[ p.id ]
                    });

    if(get){
        rsp.e = 'ok';
        if(!isN(get[0])){
            rsp.id = get[0].id_cl;
            rsp.enc = get[0].cl_enc;
            rsp.sbd = 'sumr_c_'+get[0].cl_sbd;
        }
    }else {
        rsp['w'] = 'No ID result';
    }

    return rsp;

};