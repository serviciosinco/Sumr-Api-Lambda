const   { DBSave, DBSelector, DBClose } = require('../connection'),
        { isN, getTimefromISO } = require('../common'),
        { ListDetail } = require('../system'),
        { GetAccountDetail } = require('../customer'),
        { LeadEmailDetail, LeadEmailUpdate } = require('../lead'),
        { UserDetail, UserUpdate } = require('../user'),
        { CustomerSendDetail, CustomerSendUpdate, AccountSendOpened, GetLeadSendDetail, LeadSendUpdate, LeadSendOpened, LeadSendClicked, PushmailLinkDetail } = require('../mailing'),
        userAgent = require('user-agent-parse'),
        AWS = require('aws-sdk'),
        docClient = new AWS.DynamoDB({ apiVersion: '2012-08-10' });


const SaveRequest = async function(event){
    
    try {

        if(!isN(event)){

            var date = new Date();

            return await docClient.put({
                        TableName: (process.env.NODE_ENV == 'production' ? 'prd-':'dev-') + 'rqu',
                        Item:{
                            id: date.getTime().toString(),
                            rquery: JSON.stringify( event ),
                            date_in: date.toISOString()
                        }
                    }).promise();

        }

    } catch (err) {
        
        return false;

    }

}

const Headers = (h=null)=>{

    var data=[];

    if(!isN(h)){
        for (var i=0; i<h.length; i++){
            data[ h[i].name ] = h[i].value;
        }
    }

    return data;

};


const RecoverIdToBd = async function(params=null){
    
    let response = { success:false };

    if(params?.id && params?.bd && params?.cid){

        let upd = await LeadSendUpdate({
            id:params?.id,
            bd:params?.bd,
            fields:{
                cid:params?.cid
            }
        });

        if(upd?.success){
            response.success = true;
        }else{
            response.error = upd.w;
        }

    }

    return response;

};



const BounceGetId = async function(params=null){

    let detail = null,
        prnt = null,
        response={ success:false };

    if(params?.type == 'sub'){
        detail = await ListDetail({ key:'sis_snd_bnc_tp_s' });
    }else{
        detail = await ListDetail({ key:'sis_snd_bnc_tp' });
    }

    Object.keys(detail.ls).forEach(function(key){

        var attr = detail.ls[key];

        if(attr?.key?.vl == params?.key){

            if(!isN(params?.prnt)){
                prnt = attr[params?.prnt].vl;
            }

            if(isN(prnt) || prnt){
                response.success = true;
                response.id = attr.id;
                response.cns = attr.cns;
                return;
            }

        }

    });

    return response;

};


const Delivery_Init = async function(event){

    await SaveRequest( event );
    
    var response={ success:false },
        message = JSON.parse(event.Records[0].Sns.Message),
        header = Headers(message.mail.headers),
        messageId = message.mail.messageId;

    if(header['SUMR-FLJ'] == 'cl'){

        let SendDetail = await CustomerSendDetail({ id:messageId, type:'id' });

        if(SendDetail?.id){

            let upd = await CustomerSendUpdate({
                id:SendDetail.id,
                fields:{
                    est:process.env.ID_SNDEST_ACPT
                }
            });

            if(upd?.success){
                response.success = true;
            }

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        var AccountDetail = await GetAccountDetail({ type:'enc', id:header['SUMR-CL'] });

        if(AccountDetail?.sbd){

            var SendDetail = await GetLeadSendDetail({ id:messageId, type:'id', bd:AccountDetail.sbd });

            if(SendDetail?.success && isN(SendDetail?.id)){
                var SendDetail = await GetLeadSendDetail({ id:header['SUMR-ID'], type:'enc', bd:AccountDetail.sbd });
                if(SendDetail?.success && isN(SendDetail.cid)){
                    await RecoverIdToBd({ id:SendDetail.id, bd:AccountDetail.sbd, cid:messageId });
                }
            }

            if(!isN(SendDetail?.id) && !isN(AccountDetail.id)){

                let upd = await LeadSendUpdate({
                    id:SendDetail.id,
                    bd:AccountDetail.sbd,
                    fields:{
                        est:process.env.ID_SNDEST_ACPT,
                        dlvry_tmmls: message.delivery.processingTimeMillis,
                        dlvry_tmstmp: message.delivery.timestamp,
                        dlvry_smtrsp: message.delivery.smtpResponse,
                        dlvry_rmtmta: message.delivery.reportingMTA,
                        dlvry_rmtmta_ip: message.delivery.remoteMtaIp
                    }
                });

                if(upd?.success){
                    response.success = true;
                }else{
                    response.error = !isN(upd.w)?upd.w:'';
                }

            }else{

                if(isN(SendDetail?.id)){ response.error += 'SendDetail.id empty'; }
                if(isN(AccountDetail?.id)){ response.error += 'AccountDetail.id empty'; }

            }

        }

    }

    return response;

};

const Complaint_Init = async function(event){
    
    await SaveRequest( event );

    var response = { success:false },
        message = JSON.parse(event.Records[0].Sns.Message),
        header = Headers(message.mail.headers),
        messageId = message.mail.messageId;

    if(header['SUMR-FLJ'] == 'cl'){

        let SendDetail = await CustomerSendDetail({ id:messageId, type:'id' });

        if(SendDetail?.id){

            Object.keys(message.complaint.complainedRecipients).forEach(async function(key){

                var eml = message.complaint.complainedRecipients[key].emailAddress;
                var us_dt = await UserDetail({ id:eml, type:'eml' });
                var upload_query = await UserUpdate({
                    id:us_dt.id,
                    fields:{
                        dnc: message.complaint.complaintFeedbackType,
                        sndi: 2
                    }
                });

                if(upload_query?.success){
                    response.success = true;
                }

            });

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        var AccountDetail = await GetAccountDetail({ type:'enc', id:header['SUMR-CL'] });

        if(AccountDetail?.sbd){

            var SendDetail = await GetLeadSendDetail({ id:messageId, type:'id', bd:AccountDetail.sbd });

            if(SendDetail?.success && isN(SendDetail?.id)){
                var SendDetail = await GetLeadSendDetail({ id:header['SUMR-ID'], type:'enc', bd:AccountDetail.sbd });
                if(SendDetail?.success && isN(SendDetail.cid)){
                    await RecoverIdToBd({ id:SendDetail.id, bd:AccountDetail.sbd, cid:messageId });
                }
            }

            if(!isN(SendDetail?.id) && !isN(AccountDetail.id)){

                for await (let lead of message.complaint.complainedRecipients) {

                    var eml = lead?.emailAddress;

                    if(!isN(eml)){
                        
                        var eml_dt = await LeadEmailDetail({ id:eml, bd:AccountDetail.sbd, type:'eml' });

                        var upload_query = await LeadEmailUpdate({
                            id:eml_dt.id,
                            bd:AccountDetail.sbd,
                            fields:{
                                rjct: 1,
                                sndi: 2,
                                dnc: message.complaint.complaintFeedbackType,
                                cld: process.env.ID_CLD_BAD
                            }
                        });

                        if(upload_query?.success){
                            response.success = true;
                        }

                    }

                }

            }
        
        }

    }

    return response;

};


const Bounce_Init = async function(event){

    var response = { success:false },
        message = JSON.parse(event.Records[0].Sns.Message),
        header = Headers(message.mail.headers),
        messageId = message.mail.messageId,
        tp_id = await BounceGetId({ key:message.bounce.bounceType }),
        tps_id = await BounceGetId({ type:'sub', key:message.bounce.bounceSubType });

    if(header['SUMR-FLJ'] == 'cl'){

        let SendDetail = await CustomerSendDetail({ id:messageId, type:'id' });

        if(SendDetail?.id){

            let upd = await CustomerSendUpdate({
                id:SendDetail.id,
                fields:{
                    est: process.env.ID_SNDEST_RBT,
                    bnc: JSON.stringify(message.bounce),
                    bnc_sbj: event.Records[0].Sns.Subject,
                    bnc_msg: message.bounce.bouncedRecipients[0].diagnosticCode,
                    bnc_rpr: message.bounce.reportingMTA,
                    bnc_tp: tp_id.id,
                    bnc_tp_sub: tps_id.id
                }
            });

            if(upd?.success){
                response.success = true;
            }

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        var AccountDetail = await GetAccountDetail({ type:'enc', id:header['SUMR-CL'] });

        if(AccountDetail?.sbd){

            var SendDetail = await GetLeadSendDetail({ id:messageId, type:'id', bd:AccountDetail.sbd });

            if(SendDetail?.success && isN(SendDetail?.id)){
                var SendDetail = await GetLeadSendDetail({ id:header['SUMR-ID'], type:'enc', bd:AccountDetail.sbd });
                if(SendDetail?.success && isN(SendDetail.cid)){
                    await RecoverIdToBd({ id:SendDetail.id, bd:AccountDetail.sbd, cid:messageId });
                }
            }

            if(!isN(SendDetail?.id) && !isN(AccountDetail.id)){

                let upd = await LeadSendUpdate({
                    id:SendDetail.id,
                    bd:AccountDetail.sbd,
                    fields:{
                        est:process.env.ID_SNDEST_RBT,
                        bnc: JSON.stringify(message.bounce),
                        bnc_sbj: event.Records[0].Sns.Subject,
                        bnc_msg: message.bounce.bouncedRecipients[0].diagnosticCode,
                        bnc_rpr: message.bounce.reportingMTA,
                        bnc_tp: tp_id.id,
                        bnc_tp_sub: tps_id.id
                    }
                });

                if(upd?.success){
                    response.success = true;
                }

            }

        }

    }

    return response;

};


const Open_Init = async function(event){
    
    var response={ success:false },
        message = JSON.parse(event.Records[0].Sns.Message),
        header = Headers(message.mail.headers),
        messageId = message.mail.messageId,
        uAgnt = userAgent.parse(message.open.userAgent),
        usIP = message.open.ipAddress;

    if(header['SUMR-FLJ'] == 'cl'){

        let SendDetail = await CustomerSendDetail({ id:messageId, type:'id' });
        
        if(!isN(SendDetail?.id)){

            let insert = await AccountSendOpened({
                id:SendDetail.id,
                fields:{
                    snd:SendDetail.id,
                    date:datetme.d.date,
                    hour:datetme.d.time,
                    medium:uAgnt.device_type,
                    browser:{
                        name:uAgnt.name,
                        version:uAgnt.version,
                        platform:uAgnt.os
                    }
                }
            });

            if(insert?.success){
                response.success = true;
                response.id = insert.id;
            }else{
                response.error = insert.w;
            }

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        var AccountDetail = await GetAccountDetail({ type:'enc', id:header['SUMR-CL'] }),
            SendDetail = await GetLeadSendDetail({ id:messageId, type:'id', bd:AccountDetail.sbd }),
            datetme = getTimefromISO(message.open.timestamp);

        if(SendDetail?.success && isN(SendDetail?.id)){
            var SendDetail = await GetLeadSendDetail({ id:header['SUMR-ID'], type:'enc', bd:AccountDetail.sbd });
            if(SendDetail?.success && isN(SendDetail.cid)){
                await RecoverIdToBd({ id:SendDetail.id, bd:AccountDetail.sbd, cid:messageId });
            }
        }

        if(!isN(SendDetail?.id) && !isN(AccountDetail.id)){

            let insert = await LeadSendOpened({
                id:SendDetail.id,
                bd:AccountDetail.sbd,
                fields:{
                    snd:SendDetail.id,
                    date:datetme.d.date,
                    hour:datetme.d.time,
                    medium:uAgnt.device_type,
                    ip:usIP,
                    browser:{
                        name:uAgnt.name,
                        version:uAgnt.version,
                        platform:uAgnt.os
                    }
                }
            });

            if(insert?.success){
                response.success = true;
                response.id = insert.id;
            }else{
                response.error = insert.w;
            }

        }

    }

    return response;

};


const Click_Init = async function(event){

    var response = { success:false },
        message = JSON.parse(event.Records[0].Sns.Message),
        header = Headers(message.mail.headers),
        messageId = message.mail.messageId,
        uAgnt = userAgent.parse(message.click.userAgent);

    if(header['SUMR-FLJ'] == 'cl'){

    }else if(header['SUMR-FLJ'] == 'ec'){

        var AccountDetail = await GetAccountDetail({ type:'enc', id:header['SUMR-CL'] });

        if(AccountDetail?.sbd){
                
            var SendDetail = await GetLeadSendDetail({ id:messageId, type:'id', bd:AccountDetail.sbd }),
                datetme = getTimefromISO(message.click.timestamp),
                ttobd = '';

            if(SendDetail?.success && isN(SendDetail?.id)){
                SendDetail = await GetLeadSendDetail({ id:header['SUMR-ID'], type:'enc', bd:AccountDetail.sbd });
                if(SendDetail?.success && isN(SendDetail.cid)){
                    await RecoverIdToBd({ id:SendDetail.id, bd:AccountDetail.sbd, cid:messageId });
                }
            }

            if(!isN(SendDetail?.id) && !isN(AccountDetail.id)){

                var clickTags = message.click.linkTags;
                var lnk_dt = await PushmailLinkDetail({ ec:SendDetail.ec, url:message.click.link });
        
                if(clickTags){
                    clickTags.forEach(element => { 
                        ttobd = ttobd + JSON.stringify( element );
                    });
                }

                let insert = await LeadSendClicked({
                    id:SendDetail.id,
                    bd:AccountDetail.sbd,
                    fields:{
                        lnk:lnk_dt.id,
                        snd:SendDetail.id,
                        url:message.click.link,
                        date:datetme.d.date,
                        hour:datetme.d.time,
                        medium:uAgnt.device_type,
                        browser:{
                            name:uAgnt.name,
                            version:uAgnt.version,
                            platform:uAgnt.os
                        }
                    }
                });

                if(insert?.success){
                    response.success = true;
                    response.id = insert.id;
                }else{
                    response.error = insert.w;
                }

            }

        }

    }

    return response;

};


const Oth_Init = async function(event){

    var response = { success:false };

    try {
        await SaveRequest( event );
        response.success = true;
    } catch (err) {
        response.error = err;
    }

    return response;

};

exports.Service_SES = async function(event){

    let result = {},
        message = JSON.parse(event.Records[0].Sns.Message),
        type = message.eventType ? message.eventType : message.notificationType;

    if(type == 'Delivery'){

        result = await Delivery_Init(event);

    }else if(type == 'Complaint'){

        result = await Complaint_Init(event);

    }else if(type == 'Bounce'){

        result = await Bounce_Init(event);

    }else if(type == 'Open'){

        result = await Open_Init(event);

    }else if(type == 'Click'){

        result = await Click_Init(event);

    }else{

        result = await Oth_Init(event);

    }

    //await DBClose();
    //result = await Oth_Init(event);

    return result;

};