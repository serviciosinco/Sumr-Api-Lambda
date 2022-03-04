const   mysql = require('promise-mysql'),
        { DBGet, DBSave, DBSelector } = require('./connection'),
        { isN, AwsDeviceId, nToBol } = require('./common'),
        AWS = require('aws-sdk'),
        DYNAMO = new AWS.DynamoDB.DocumentClient();


const GetCampaignDetail = async( params )=>{

    var response = {};

    if(params?.id){
        
        let tableSource = `${process?.env?.DYNAMO_PRFX}-ec-cmpg`;

        var row = await DYNAMO.query({
                    TableName : tableSource,
                    KeyConditionExpression: "#id=:idv",
                    ExpressionAttributeNames:{ "#id": "id" },
                    ExpressionAttributeValues: { ":idv": params?.id },
                    Limit: 1
                }).promise();
        
        if(!row?.Items[0]){
            
            var row = await DYNAMO.scan({
                    TableName: tableSource,
                    ProjectionExpression: 'id_eccmpg, eccmpg_tot_upd, eccmpg_p_f',
                    FilterExpression: '#id=:idv',
                    ExpressionAttributeValues: {
                        ':idv': params?.id,
                    }
                }).promise();

        }

        if(row?.Items[0]){

            response.id = row?.Items[0]?.id_eccmpg;
            response.total = {
                update : nToBol( row?.Items[0]?.eccmpg_tot_upd )
            };

            let DateNow = new Date(),
                DateSent = new Date(row?.Items[0]?.eccmpg_p_f),
                DiffTime = DateNow.getTime() - DateSent.getTime();
                DiffInDays = DiffTime / (1000 * 3600 * 24);

            response.diff = {
                days:Math.round(DiffInDays)
            }

        }


    }

    return response;

}


const LeadSend_FindCampaign = async function( params=null ){

    let field,
        response={ status:false };

    if(params?.id){

        if(params.type == 'snd'){ field = 'ecsndcmpg_snd'; }
        else if(params.type == 'cmpg'){ field = 'ecsndcmpg_cmpg'; }
        else{ field = 'id_ecsndcmpg'; }

        let get = await DBGet({
                            query: `SELECT ecsndcmpg_cmpg FROM ${ DBSelector('ec_snd_cmpg',{ account:params?.account }) } WHERE ${field}=? LIMIT 1`,
                            data:[ params?.id ]
                        });

        if(get){
            response.status = true;
            if(!isN(get[0])){
                response.id = get[0].ecsndcmpg_cmpg;
            }
        }else {
            response.error = 'No ID result';
        }

    }

    return response;

};


const CampaignQueueToUpdate = async function(params=null){

    let response={ status:false };

    if(params?.id){

        let CampaignDetail = params?.id ? await GetCampaignDetail({ id:params?.id }) : null ; console.log('CampaignDetail:', CampaignDetail);

        if(CampaignDetail?.id && !CampaignDetail?.total?.update && ( CampaignDetail?.diff?.days < 60 || !CampaignDetail?.diff )){

            let updateDynamo = await DYNAMO.update({
                                    TableName: `${process?.env?.DYNAMO_PRFX}-ec-cmpg`,
                                    Key:{ id:CampaignSend?.id },
                                    UpdateExpression: 'set eccmpg_tot_upd=:vtotupd',
                                    ExpressionAttributeValues:{
                                        ":vtotupd": 1
                                    },
                                    ReturnValues:"ALL_NEW"
                                }).promise();

            if(updateDynamo?.Attributes){

                let updateRDS = await DBSave({
                    query:`UPDATE ${ DBSelector('ec_cmpg') } SET eccmpg_tot_upd=? WHERE id_eccmpg=? LIMIT 1`,
                    data:[ 1, CampaignSend?.id ]
                });

                if(!isN(updateRDS) && !isN(updateRDS.affectedRows) && updateRDS.affectedRows > 0){
                    response.success = true;
                }

            }

        }else{

            console.log(`No update campaign ${ CampaignDetail?.diff?.days } days left`);

        }

    }

    return response;

}


exports.CustomerSendDetail  = async function(params=null){

    let fields,
        response={ success:false };

    if(params?.type == 'enc'){ fields = 'clfljsnd_enc'; }
    else if(params?.type == 'id'){ fields = 'clfljsnd_id'; }
    else{ fields = 'id_clfljsnd'; }

    let get = await DBGet({
                        query: `SELECT id_clfljsnd FROM ${ DBSelector('_cl_flj_snd') } INNER JOIN _cl_flj ON clfljsnd_clflj = id_clflj WHERE ${fields}=? LIMIT 1`,
                        data:[ params?.id ]
                    });

    if(get){
        response.success = true;
        if(!isN(get[0])){
            response.id = get[0].id_clfljsnd;
        }
    }else {
        response.error = 'No ID result';
    }

    return response;

};

exports.CustomerSendUpdate = async function(params=null){

    let response = { success:false };

    if(!isN(params?.fields)){
        let upload_fields=[];
        if(!isN(params?.fields?.est)){ upload_fields.push( mysql.format('clfljsnd_est=?', params?.fields?.est) ); }
        if(!isN(params?.fields?.bnc)){ upload_fields.push( mysql.format('clfljsnd_bnc=?', params?.fields?.bnc) ); }
        if(!isN(params?.fields?.bnc_sbj)){ upload_fields.push( mysql.format('clfljsnd_bnc=?', params?.fields?.bnc_sbj) ); }
        if(!isN(params?.fields?.bnc_msg)){ upload_fields.push( mysql.format('clfljsnd_bnc_msg=?', params?.fields?.bnc_msg) ); }
        if(!isN(params?.fields?.bnc_tp)){ upload_fields.push( mysql.format('clfljsnd_bnc_tp=?', params?.fields?.bnc_tp) ); }
        if(!isN(params?.fields?.bnc_tp_sub)){ upload_fields.push( mysql.format('clfljsnd_bnc_tp_sub=?', params?.fields?.bnc_tp_sub) ); }
        if(!isN(params?.fields?.bnc_rpr)){ upload_fields.push( mysql.format('clfljsnd_bnc_rpr=?', params?.fields?.bnc_rpr) ); }
        if(!isN(params?.fields?.bnc_rule)){ upload_fields.push( mysql.format('clfljsnd_bnc_rule=?', params?.fields?.bnc_rule) ); }
        var upload_query = upload_fields.join(',');
    }

    if(!isN(params?.id) && !isN(upload_query)){

        let SaveRDS =  await DBSave({
            query:`UPDATE ${ DBSelector('_cl_flj_snd') } SET ${upload_query} WHERE id_clfljsnd=? LIMIT 1`,
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



exports.AccountSendOpened = async function(params=null){

    let response = { success:false };

    if(params?.fields?.snd){

        var openDevice = AwsDeviceId(params?.fields?.medium);

        let SaveRDS =  await DBSave({
            query:`INSERT INTO ${ DBSelector('_cl_flj_snd_op') } (clfljsndop_snd, eclfljsndop_f, clfljsndop_h, clfljsndop_m, clfljsndop_brw_t, clfljsndop_brw_v, clfljsndop_brw_p) VALUES (?,?,?,?,?,?,?)`,
            data:[ 
                params?.fields?.snd,
                params?.fields?.date,
                params?.fields?.hour,
                openDevice,
                params?.fields?.browser.name,
                params?.fields?.browser.version,
                params?.fields?.browser.platform
            ]
        });

        if(SaveRDS?.affectedRows > 0 && SaveRDS?.insertId){

            response.id = insertRDS.insertId;
            response.success = true;

        }else {
            if(SaveRDS?.w?.errno && SaveRDS?.w?.sqlMessage){
				response.error = SaveRDS?.w?.sqlMessage;
            }
        }

    }

    return response;

};




exports.GetLeadSendDetail = async function(params=null){

    let fields,
        response={ success:false },
        database='';

    if(params?.type == 'enc'){ fields = 'ecsnd_enc'; }
    else if(params?.type == 'id'){ fields = 'ecsnd_id'; }
    else{ fields = 'id_ecsnd'; }

    let get = await DBGet({
                        query: `SELECT id_ecsnd, ecsnd_id, ecsnd_ec, ecsnd_est FROM ${ DBSelector('ec_snd',{ account:params?.account }) } WHERE ${fields}=? LIMIT 1`,
                        data:[ params?.id ]
                    });

    if(get){
        response.success = true;
        if(!isN(get[0])){
            response.id = get[0].id_ecsnd;
            response.cid = get[0].ecsnd_id;
            response.ec = get[0].ecsnd_ec;
            response.est = get[0].ecsnd_est;
        }
    }else {
        response.error = 'No ID result';
    }

    return response;

};


exports.LeadSendUpdate = async function(params=null){

    let response = { success:false };

    if(!isN(params?.fields)){
        let upload_fields=[];
        if(!isN(params?.fields?.cid)){ upload_fields.push( mysql.format('ecsnd_id=?', params?.fields?.cid) ); }
        if(!isN(params?.fields?.est)){ upload_fields.push( mysql.format('ecsnd_est=?', params?.fields?.est) ); }
        if(!isN(params?.fields?.dlvry_tmmls)){ upload_fields.push( mysql.format('ecsnd_dlvry_tmmls=?', params?.fields?.dlvry_tmmls) ); }
        if(!isN(params?.fields?.dlvry_tmstmp)){ upload_fields.push( mysql.format('ecsnd_dlvry_tmstmp=?', params?.fields?.dlvry_tmstmp) ); }
        if(!isN(params?.fields?.dlvry_smtrsp)){ upload_fields.push( mysql.format('ecsnd_dlvry_smtrsp=?', params?.fields?.dlvry_smtrsp) ); }
        if(!isN(params?.fields?.dlvry_rmtmta)){ upload_fields.push( mysql.format('ecsnd_dlvry_rmtmta=?', params?.fields?.dlvry_rmtmta) ); }
        if(!isN(params?.fields?.dlvry_rmtmta_ip)){ upload_fields.push( mysql.format('ecsnd_dlvry_rmtmta_ip=?', params?.fields?.dlvry_rmtmta_ip) ); }
        if(!isN(params?.fields?.bnc)){ upload_fields.push( mysql.format('ecsnd_bnc=?', params?.fields?.bnc) ); }
        if(!isN(params?.fields?.bnc_sbj)){ upload_fields.push( mysql.format('ecsnd_bnc=?', params?.fields?.bnc_sbj) ); }
        if(!isN(params?.fields?.bnc_msg)){ upload_fields.push( mysql.format('ecsnd_bnc_msg=?', params?.fields?.bnc_msg) ); }
        if(!isN(params?.fields?.bnc_tp)){ upload_fields.push( mysql.format('ecsnd_bnc_tp=?', params?.fields?.bnc_tp) ); }
        if(!isN(params?.fields?.bnc_tp_sub)){ upload_fields.push( mysql.format('ecsnd_bnc_tp_sub=?', params?.fields?.bnc_tp_sub) ); }
        if(!isN(params?.fields?.bnc_rpr)){ upload_fields.push( mysql.format('ecsnd_bnc_rpr=?', params?.fields?.bnc_rpr) ); }
        if(!isN(params?.fields?.bnc_rule)){ upload_fields.push( mysql.format('ecsnd_bnc_rule=?', params?.fields?.bnc_rule) ); }
        var upload_query = upload_fields.join(',');
    }

    if(!isN(params?.id) && !isN(upload_query)){

        let SaveRDS =  await DBSave({
            query:`UPDATE ${ DBSelector('ec_snd',{ account:params?.account }) } SET ${upload_query} WHERE id_ecsnd=? LIMIT 1`,
            data:[ params?.id ]
        });

        if(SaveRDS?.affectedRows > 0){

            if(!isN(params?.fields?.est)){
                
                let updateDynamo = await DYNAMO.update({
                    TableName: `${process?.env?.DYNAMO_PRFX}-ec-snd`,
                    Key:{ id:params?.id },
                    UpdateExpression: 'set ecsnd_est=:vest',
                    ExpressionAttributeValues:{
                        ":vest": params?.fields?.est
                    },
                    ReturnValues:"ALL_NEW"
                }).promise();
                
                if(updateDynamo?.Attributes){

                    response.success = true;

                }

            }else{

                response.success = true;

            }

        }else {
            response.error = 'No ID result';
        }

    }

    return response;

};



exports.LeadSendOpened = async function(params=null){

    let response = { success:false };

    if(params?.account){

        var openDevice = AwsDeviceId(params?.fields?.medium);

        let SaveRDS =  await DBSave({
            query:`INSERT INTO ${ DBSelector('ec_op',{ account:params?.account }) } (ecop_snd, ecop_f, ecop_h, ecop_m, ecop_brw_t, ecop_brw_v, ecop_brw_p, ecop_ip) VALUES (?,?,?,?,?,?,?,?)`,
            data:[ 
                params?.fields?.snd,
                params?.fields?.date,
                params?.fields?.hour,
                openDevice,
                params?.fields?.browser.name,
                params?.fields?.browser.version,
                params?.fields?.browser.platform,
                params?.fields?.ip
            ]
        });

        if(SaveRDS?.affectedRows > 0 && SaveRDS?.insertId){

            response.id = SaveRDS?.insertId;

            let CampaignSend = await ({ id:params?.fields?.snd, type:'snd' })
                PutOnQueueUpdate = await CampaignQueueToUpdate({ id:CampaignSend?.id });

            if(PutOnQueueUpdate.success){
                response.success = true;
            }

        }else {
            if(SaveRDS?.w?.errno && SaveRDS?.w?.sqlMessage){
				response.error = SaveRDS?.w?.sqlMessage;
            }
        }

    }

    return response;

};




exports.LeadSendClicked = async function(params=null){

    let response = { success:false };

    if(params?.account){

        var openDevice = AwsDeviceId(params?.fields?.medium);

        let SaveRDS =  await DBSave({
            query:`INSERT INTO ${ DBSelector('ec_trck',{ account:params?.account }) } (ectrck_lnk, ectrck_snd, ectrck_f, ectrck_h, ectrck_m, ectrck_brw_t, ectrck_brw_v, ectrck_brw_p) VALUES (?,?,?,?,?,?,?,?)`,
            data:[ 
                params?.fields?.lnk,
                params?.fields?.snd,
                params?.fields?.date,
                params?.fields?.hour,
                openDevice,
                params?.fields?.browser.name,
                params?.fields?.browser.version,
                params?.fields?.browser.platform
            ]
        });

        if(SaveRDS?.affectedRows > 0 && SaveRDS?.insertId){
           
            response.success = true;
            response.id = SaveRDS?.insertId;

            let SaveUrl = await DBSave({
                query:`INSERT INTO ${ DBSelector('ec_trck_attr',{ account:params?.account }) } (ectrckattr_ectrck, ectrckattr_key, ectrckattr_value) VALUES (?,?,?)`,
                data:[ 
                    params?.id,
                    'url',
                    params?.fields?.url
                ]
            });

            if(SaveUrl?.affectedRows > 0 && SaveUrl?.insertId){
                
                response.url = { id:SaveUrl?.insertId };

                let CampaignSend = await LeadSend_FindCampaign({ id:params?.fields?.snd, type:'snd', account:params?.account })
                    PutOnQueueUpdate = await CampaignQueueToUpdate({ id:CampaignSend?.id });

                if(PutOnQueueUpdate.success){
                    response.success = true;
                }

            }

        }else {
            if(SaveRDS?.w?.errno && SaveRDS?.w?.sqlMessage){
				response.error = SaveRDS?.w?.sqlMessage;
            }
        }

    }

    return response;

};


exports.PushmailLinkDetail = async function(params=null){

    let response = { success:false };

    if(!isN(params?.ec) && !isN(params?.url)){

        let get = await DBGet({
                            query: `SELECT id_eclnk FROM ${ DBSelector('ec_lnk') } WHERE eclnk_ec=? AND eclnk_lnk_c=? LIMIT 1`,
                            data:[ params?.ec, params?.url ]
                        });

        if(get){
            response.success = true;
            if(!isN(get[0])){
                response.id = get[0].id_eclnk;
            }
        }else {
            response.error = 'No ID result';
        }

    }

    return response;

};