const { DBGet, DBSelector } = require('./connection');
const { isN } = require('./common');

exports.GetAccountDetail = async function(params=null){

    let fields='',
        response={ success:false };

    if(params?.type == 'enc'){ fields = 'cl_enc'; }
    else if(params?.type == 'sbd'){ fields = 'cl_sbd'; }
    else{ fields = 'id_cl'; }

    let get = await DBGet({
                    query: `SELECT id_cl, cl_enc, cl_sbd FROM `+DBSelector('_cl')+` WHERE ${fields}=? LIMIT 1`,
                    data:[ params?.id ]
                });

    if(get){
        response.success = true;
        if(!isN(get[0])){
            response.id = get[0].id_cl;
            response.enc = get[0].cl_enc;
            response.sbd = 'sumr_c_'+get[0].cl_sbd;
        }
    }else {
        response.error = 'No ID result';
    }

    return response;

};