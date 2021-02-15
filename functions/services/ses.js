const   { DBSave, DBSelector } = require('../connection'),
        { isN } = require('../common'),
        { ListDetail } = require('../system'),
        { CustomerDetail } = require('../customer'),
        { LeadEmailDetail, LeadEmailUpdate } = require('../lead'),
        { UserDetail, UserUpdate } = require('../user'),
        { CustomerSendDetail, CustomerSendUpdate, LeadSendDetail, LeadSendUpdate } = require('../mailing');



const Headers = (h=null)=>{

    var data=[];

    if(!isN(h)){
        for (var i=0; i<h.length; i++){
            data[ h[i].name ] = h[i].value;
        }
    }

    return data;

};

const BounceGetId = async function(p=null){

    let detail = null,
        prnt = null,
        rsp={e:'no'};

    if(p.t == 'sub'){
        detail = await ListDetail({ key:'sis_snd_bnc_tp_s' });
    }else{
        detail = await ListDetail({ key:'sis_snd_bnc_tp' });
    }

    Object.keys(detail.ls).forEach(function(key){

        var attr = detail.ls[key];

        if(attr.key.vl == p.key){

            if(!isN(p.prnt)){
                prnt = attr[p.prnt].vl;
            }

            if(isN(prnt) || prnt){
                rsp.e = 'ok';
                rsp.id = attr.id;
                rsp.cns = attr.cns;
                return;
            }

        }

    });

    return rsp;

};


const Delivery_Init = async function(event){

    var data={e:'no'};

    const message = JSON.parse(event.Records[0].Sns.Message);
    let header = Headers(message.mail.headers);
    let messageId = message.mail.messageId;

    if(header['SUMR-FLJ'] == 'cl'){

        let snd_dt = await CustomerSendDetail({ id:messageId, t:'id' });

        if(!isN(snd_dt.id)){

            let upd = await CustomerSendUpdate({
                id:snd_dt.id,
                f:{
                    est:process.env.ID_SNDEST_ACPT
                }
            });

            if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                data['e'] = 'ok';
            }

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        let cl_dt = await CustomerDetail({ t:'enc', id:header['SUMR-CL'] });
        let snd_dt = await LeadSendDetail({ id:messageId, t:'id', bd:cl_dt.sbd });

        if(!isN(snd_dt.id) && !isN(cl_dt.id)){

            let upd = await LeadSendUpdate({
                id:snd_dt.id,
                bd:cl_dt.sbd,
                f:{
                    est:process.env.ID_SNDEST_ACPT,
                    dlvry_tmmls: message.delivery.processingTimeMillis,
                    dlvry_tmstmp: message.delivery.timestamp,
                    dlvry_smtrsp: message.delivery.smtpResponse,
                    dlvry_rmtmta: message.delivery.reportingMTA,
                    dlvry_rmtmta_ip: message.delivery.remoteMtaIp
                }
            });

            if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                data['e'] = 'ok';
            }else{
                data['w'] = !isN(upd.w)?upd.w:'';
            }

        }else{

            if(isN(snd_dt.id)){ data['w'] += 'snd_dt.id empty'; }
            if(isN(cl_dt.id)){ data['w'] += 'cl_dt.id empty'; }

        }

    }

    return data;

};

const Complaint_Init = async function(event){

    var data={e:'no'};

    const message = JSON.parse(event.Records[0].Sns.Message);
    let header = Headers(message.mail.headers);
    let messageId = message.mail.messageId;

    if(header['SUMR-FLJ'] == 'cl'){

        let snd_dt = await CustomerSendDetail({ id:messageId, t:'id' });

        if(!isN(snd_dt.id)){

            Object.keys(message.complaint.complainedRecipients).forEach(async function(key){

                var eml = message.complaint.complainedRecipients[key].emailAddress;
                var us_dt = await UserDetail({ id:eml, t:'eml' });

                var upd = await UserUpdate({
                    id:us_dt.id,
                    f:{
                        dnc: message.complaint.complaintFeedbackType,
                        sndi: 2
                    }
                });

                if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                    data['e'] = 'ok';
                }

            });

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        let cl_dt = await CustomerDetail({ t:'enc', id:header['SUMR-CL'] });
        let snd_dt = await LeadSendDetail({ id:messageId, t:'id', bd:cl_dt.sbd });

        if(!isN(snd_dt.id) && !isN(cl_dt.id)){

            Object.keys(message.complaint.complainedRecipients).forEach(async function(key){

                var eml = message.complaint.complainedRecipients[key].emailAddress;
                var eml_dt = await LeadEmailDetail({ id:eml, t:'eml' });

                var upd = await LeadEmailUpdate({
                    id:eml_dt.id,
                    f:{
                        rjct: 1,
                        sndi: 2,
                        dnc: message.complaint.complaintFeedbackType,
                        cld: process.env.ID_CLD_BAD
                    }
                });

                if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                    data['e'] = 'ok';
                }

            });

        }

    }

    return data;

};


const Bounce_Init = async function(event){

    var data={e:'no'};

    const message = JSON.parse(event.Records[0].Sns.Message);
    let header = Headers(message.mail.headers);
    let messageId = message.mail.messageId;
    let tp_id = await BounceGetId({ key:message.bounce.bounceType });
    let tps_id = await BounceGetId({ t:'sub', key:message.bounce.bounceSubType });

    if(header['SUMR-FLJ'] == 'cl'){

        let snd_dt = await CustomerSendDetail({ id:messageId, t:'id' });

        if(!isN(snd_dt.id)){

            let upd = await CustomerSendUpdate({
                id:snd_dt.id,
                f:{
                    est: process.env.ID_SNDEST_RBT,
                    bnc: JSON.stringify(message.bounce),
                    bnc_sbj: event.Records[0].Sns.Subject,
                    bnc_msg: message.bounce.bouncedRecipients[0].diagnosticCode,
                    bnc_rpr: message.bounce.reportingMTA,
                    bnc_tp: tp_id.id,
                    bnc_tp_sub: tps_id.id
                }
            });

            if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                data['e'] = 'ok';
            }

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        let cl_dt = await CustomerDetail({ t:'enc', id:header['SUMR-CL'] });
        let snd_dt = await LeadSendDetail({ id:messageId, t:'id', bd:cl_dt.sbd });

        if(!isN(snd_dt.id) && !isN(cl_dt.id)){

            let upd = await LeadSendUpdate({
                id:snd_dt.id,
                bd:cl_dt.sbd,
                f:{
                    est:process.env.ID_SNDEST_RBT,
                    bnc: JSON.stringify(message.bounce),
                    bnc_sbj: event.Records[0].Sns.Subject,
                    bnc_msg: message.bounce.bouncedRecipients[0].diagnosticCode,
                    bnc_rpr: message.bounce.reportingMTA,
                    bnc_tp: tp_id.id,
                    bnc_tp_sub: tps_id.id
                }
            });

            if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                data['e'] = 'ok';
            }

        }

    }

    return data;

};


const Open_Init = async function(event){

    var data={e:'no'};

    const message = JSON.parse(event.Records[0].Sns.Message);
    let header = Headers(message.mail.headers);
    let messageId = message.mail.messageId;

    if(header['SUMR-FLJ'] == 'cl'){

        let snd_dt = await CustomerSendDetail({ id:messageId, t:'id' });

        if(!isN(snd_dt.id)){

            let upd = await CustomerSendUpdate({
                id:snd_dt.id,
                f:{
                    est: process.env.ID_SNDEST_RBT,
                    bnc: JSON.stringify(message.bounce),
                    bnc_sbj: event.Records[0].Sns.Subject,
                    bnc_msg: message.bounce.bouncedRecipients[0].diagnosticCode,
                    bnc_rpr: message.bounce.reportingMTA,
                    bnc_tp: tp_id.id,
                    bnc_tp_sub: tps_id.id
                }
            });

            if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                data['e'] = 'ok';
            }

        }

    }else if(header['SUMR-FLJ'] == 'ec'){

        let cl_dt = await CustomerDetail({ t:'enc', id:header['SUMR-CL'] });
        let snd_dt = await LeadSendDetail({ id:messageId, t:'id', bd:cl_dt.sbd });

        if(!isN(snd_dt.id) && !isN(cl_dt.id)){

            let upd = await LeadSendOpened({
                id:snd_dt.id,
                bd:cl_dt.sbd,
                f:{
                    est:process.env.ID_SNDEST_RBT,
                    bnc: JSON.stringify(message.bounce),
                    bnc_sbj: event.Records[0].Sns.Subject,
                    bnc_msg: message.bounce.bouncedRecipients[0].diagnosticCode,
                    bnc_rpr: message.bounce.reportingMTA,
                    bnc_tp: tp_id.id,
                    bnc_tp_sub: tps_id.id
                }
            });

            if(!isN(upd) && !isN(upd.e) && upd.e == 'ok'){
                data['e'] = 'ok';
            }

        }

    }

    return data;

};


const Click_Init = async function(event){

    var data={e:'no'};
    const message = JSON.parse(event.Records[0].Sns.Message);
    let click = message.click;

    let save = await DBSave({
        q:`INSERT INTO `+DBSelector('____RQ')+`(rq) VALUES ('${click}')`
    });

    if(!isN(save) && !isN(save.affectedRows) && save.affectedRows > 0){
        data['e'] = 'ok';
    }else {
        data['w'] = 'No ID result';
    }

    return data;

};


const Oth_Init = async function(event){

    var data={e:'no'};
    const message = JSON.stringify( event );

    let save = await DBSave({
        q:`INSERT INTO `+DBSelector('____RQ')+`(rq) VALUES ('${message}')`
    });

    if(!isN(save) && !isN(save.affectedRows) && save.affectedRows > 0){
        data['e'] = 'ok';
    }else {
        data['w'] = 'No ID result';
    }

    return data;

};

exports.Service_SES = async function(event){

    //const decoded = JSON.parse(event.Records[0].Sns.Message);

    let result = '';
    let message = JSON.parse(event.Records[0].Sns.Message);
    let type = message.notificationType;

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

    return result;

};