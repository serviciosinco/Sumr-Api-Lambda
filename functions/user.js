const { DBGet, DBSave, DBSelector } = require('./connection');
const { isN } = require('./common');
exports.UserDetail = async function(params=null){

    let fields,
        response={ success:false };

    if(params?.type == 'enc'){ fields = 'us_enc'; }
    else if(params?.type == 'eml'){ fields = 'us_user'; }
    else{ fields = 'id_us'; }

    let get = await DBGet({
                        query: `SELECT id_us FROM `+DBSelector('us')+` WHERE ${fields}=? LIMIT 1`,
                        data:[ params?.id ]
                    });

    if(get){
        response.success = true;
        if(!isN(get[0])){
            response.id = get[0].id_us;
        }
    }else {
        response.error = 'No ID result';
    }

    return response;

};

exports.UserUpdate = async function(params=null){

    let response = { success:false },
        database = '';

    if(!isN(params?.fields)){
        let upload_fields=[];
        if(!isN(params?.fields?.dnc)){ upload_fields.push( mysql.format('us_eml_dnc=?', params?.fields?.dnc) ); }
        if(!isN(params?.fields?.rjct)){ upload_fields.push( mysql.format('us_eml_rjct=?', params?.fields?.rjct) ); }
        if(!isN(params?.fields?.sndi)){ upload_fields.push( mysql.format('us_eml_sndi=?', params?.fields?.sndi) ); }
        var upload_query = upload_fields.join(',');
    }

    if(!isN(params?.id) && !isN(upload_query)){

        if(params?.bd){ database=params?.bd; }

        let SaveRDS =  await DBSave({
            query:`UPDATE `+DBSelector('us',database)+` SET ${upload_query} WHERE id_us=? LIMIT 1`,
            data:[ params?.id ]
        });

        if(SaveRDS?.affectedRows > 0){
            response.success = true;
        }else {
            response.error = 'No ID result';
        }

    }

    return response;

};