const mysql = require('promise-mysql');
const { DBGet, DBSave, DBSelector } = require('./connection');
const { isN } = require('./common');

exports.LeadEmailDetail = async function(params=null){

    let fields,
        response={ success:false },
        database='';

    if(params?.type == 'enc'){ fields = 'cnteml_enc'; }
    else if(params?.type == 'eml'){ fields = 'cnteml_eml'; }
    else{ fields = 'id_cnteml'; }

    let result = await DBGet({
                        query: `SELECT id_cnteml FROM ${ DBSelector('cnt_eml',{ account:params?.account }) } WHERE ${fields}=? LIMIT 1`,
                        data:[ params?.id ]
                    });

    if(result){
        response.success = true;
        if(!isN(result[0])){
            response.id = result[0].id_cnteml;
        }
    }else {
        response.error = 'No ID result';
    }

    return response;

};

exports.LeadEmailUpdate = async function(params=null){

    let response = { success:false },
        upload_fields=[],
        database='',
        upload_query='';

    if(!isN(params?.fields)){
        if(!isN(params?.fields?.rjct)){ upload_fields.push( mysql.format('cnteml_rjct=?', params?.fields?.rjct) ); }
        if(!isN(params?.fields?.dnc)){ upload_fields.push( mysql.format('cnteml_dnc=?', params?.fields?.dnc) ); }
        if(!isN(params?.fields?.cld)){ upload_fields.push( mysql.format('cnteml_cld=?', params?.fields?.cld) ); }
        upload_query = upload_fields.join(',');
    }

    if(!isN(params?.id) && !isN(upload_query)){

        let SaveRDS =  await DBSave({
            query:`UPDATE ${ DBSelector('cnt_eml',{ account:params?.account }) } SET ${upload_query} WHERE id_cnteml=? LIMIT 1`,
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