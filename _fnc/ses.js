var fs = require('fs'),
    mysql = require('promise-mysql'),
    SUMR_db = require('./db'),
    SUMR_f = require('./glbl'),
    SUMR_sis = require('./sis');

var ses = {


    hdr:function(h=null){

        var data=[];

        if(!SUMR_f.isN(h)){
            for (var i=0; i<h.length; i++){
                data[ h[i].name ] = h[i].value;
            }
        }

        return data;
    },

    init: async function(event){

        const message = JSON.parse(event.Records[0].Sns.Message);
        let result = '';
        let type = message.notificationType;

        if(type == 'Delivery'){

            result = await this.sns.dlvry(event);

        }else if(type == 'Complaint'){

            result = await this.sns.cmpl(event);

        }else if(type == 'Bounce'){

            result = await this.sns.bnce(event);

        }

        return result;

    },

    cl:{

        dt:async function(p=null){

            let fld='',
                rsp={e:'no'};

            if(p.t == 'enc'){ fld = 'cl_enc'; }
            else if(p.t == 'sbd'){ fld = 'cl_sbd'; }
            else{ fld = 'id_cl'; }

            let get = await SUMR_db.get({
                                q: `SELECT id_cl, cl_enc, cl_sbd FROM `+SUMR_db.str('_cl')+` WHERE ${fld}=? LIMIT 1`,
                                d:[ p.id ]
                            });

            if(get){
                rsp.e = 'ok';
                if(!SUMR_f.isN(get[0])){
                    rsp.id = get[0].id_cl;
                    rsp.enc = get[0].cl_enc;
                    rsp.sbd = 'sumr_c_'+get[0].cl_sbd;
                }
            }else {
                rsp['w'] = 'No ID result';
            }

            return rsp;

        },

        snd:{

            dt:async function(p=null){

                let fld,
                    rsp={e:'no'};

                if(p.t == 'enc'){ fld = 'clfljsnd_enc'; }
				else if(p.t == 'id'){ fld = 'clfljsnd_id'; }
                else{ fld = 'id_clfljsnd'; }

                let get = await SUMR_db.get({
                                    q: `SELECT id_clfljsnd FROM `+SUMR_db.str('_cl_flj_snd')+` INNER JOIN _cl_flj ON clfljsnd_clflj = id_clflj WHERE ${fld}=? LIMIT 1`,
                                    d:[ p.id ]
                                });

                if(get){
                    rsp.e = 'ok';
                    if(!SUMR_f.isN(get[0])){
                        rsp.id = get[0].id_clfljsnd;
                    }
                }else {
                    rsp['w'] = 'No ID result';
                }

                return rsp;

            },

            upd:async function(p=null){

                let rsp={e:'no'};

                if(!SUMR_f.isN(p.f)){
                    let upf=[];
                    if(!SUMR_f.isN(p.f.est)){ upf.push( mysql.format('clfljsnd_est=?', p.f.est) ); }
                    if(!SUMR_f.isN(p.f.bnc)){ upf.push( mysql.format('clfljsnd_bnc=?', p.f.bnc) ); }
                    if(!SUMR_f.isN(p.f.bnc_sbj)){ upf.push( mysql.format('clfljsnd_bnc=?', p.f.bnc_sbj) ); }
                    if(!SUMR_f.isN(p.f.bnc_msg)){ upf.push( mysql.format('clfljsnd_bnc_msg=?', p.f.bnc_msg) ); }
                    if(!SUMR_f.isN(p.f.bnc_tp)){ upf.push( mysql.format('clfljsnd_bnc_tp=?', p.f.bnc_tp) ); }
                    if(!SUMR_f.isN(p.f.bnc_tp_sub)){ upf.push( mysql.format('clfljsnd_bnc_tp_sub=?', p.f.bnc_tp_sub) ); }
                    if(!SUMR_f.isN(p.f.bnc_rpr)){ upf.push( mysql.format('clfljsnd_bnc_rpr=?', p.f.bnc_rpr) ); }
                    if(!SUMR_f.isN(p.f.bnc_rule)){ upf.push( mysql.format('clfljsnd_bnc_rule=?', p.f.bnc_rule) ); }
                    var upd = upf.join(',');
                }

                if(!SUMR_f.isN(p.id) && !SUMR_f.isN(upd)){

                    let save = await SUMR_db.save({
                        q:`UPDATE `+SUMR_db.str('_cl_flj_snd')+` SET ${upd} WHERE id_clfljsnd=?`,
                        d:[ p.id ]
                    });

                    if(!SUMR_f.isN(save) && !SUMR_f.isN(save.affectedRows) && save.affectedRows > 0){
                        rsp.e = 'ok';
                    }else {
                        rsp['w'] = 'No ID result';
                    }

                }

                return rsp;

            }

        }
    },


    cnt:{

        snd:{

            dt:async function(p=null){

                let fld,
                    rsp={e:'no'};

                if(p.t == 'enc'){ fld = 'ecsnd_enc'; }
				else if(p.t == 'id'){ fld = 'ecsnd_id'; }
                else{ fld = 'id_ecsnd'; }

                if(!SUMR_f.isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

                let get = await SUMR_db.get({
                                    q: `SELECT id_ecsnd FROM `+SUMR_db.str('ec_snd',bd)+` WHERE ${fld}=? LIMIT 1`,
                                    d:[ p.id ]
                                });

                if(get){
                    rsp.e = 'ok';
                    if(!SUMR_f.isN(get[0])){
                        rsp.id = get[0].id_ecsnd;
                    }
                }else {
                    rsp['w'] = 'No ID result';
                }

                return rsp;

            },

            upd:async function(p=null){

                let rsp={e:'no'};

                if(!SUMR_f.isN(p.f)){
                    let upf=[];
                    if(!SUMR_f.isN(p.f.est)){ upf.push( mysql.format('ecsnd_est=?', p.f.est) ); }
                    if(!SUMR_f.isN(p.f.dlvry_tmmls)){ upf.push( mysql.format('ecsnd_dlvry_tmmls=?', p.f.dlvry_tmmls) ); }
                    if(!SUMR_f.isN(p.f.dlvry_tmstmp)){ upf.push( mysql.format('ecsnd_dlvry_tmstmp=?', p.f.dlvry_tmstmp) ); }
                    if(!SUMR_f.isN(p.f.dlvry_smtrsp)){ upf.push( mysql.format('ecsnd_dlvry_smtrsp=?', p.f.dlvry_smtrsp) ); }
                    if(!SUMR_f.isN(p.f.dlvry_rmtmta)){ upf.push( mysql.format('ecsnd_dlvry_rmtmta=?', p.f.dlvry_rmtmta) ); }
                    if(!SUMR_f.isN(p.f.dlvry_rmtmta_ip)){ upf.push( mysql.format('ecsnd_dlvry_rmtmta_ip=?', p.f.dlvry_rmtmta_ip) ); }
                    if(!SUMR_f.isN(p.f.bnc)){ upf.push( mysql.format('ecsnd_bnc=?', p.f.bnc) ); }
                    if(!SUMR_f.isN(p.f.bnc_sbj)){ upf.push( mysql.format('ecsnd_bnc=?', p.f.bnc_sbj) ); }
                    if(!SUMR_f.isN(p.f.bnc_msg)){ upf.push( mysql.format('ecsnd_bnc_msg=?', p.f.bnc_msg) ); }
                    if(!SUMR_f.isN(p.f.bnc_tp)){ upf.push( mysql.format('ecsnd_bnc_tp=?', p.f.bnc_tp) ); }
                    if(!SUMR_f.isN(p.f.bnc_tp_sub)){ upf.push( mysql.format('ecsnd_bnc_tp_sub=?', p.f.bnc_tp_sub) ); }
                    if(!SUMR_f.isN(p.f.bnc_rpr)){ upf.push( mysql.format('ecsnd_bnc_rpr=?', p.f.bnc_rpr) ); }
                    if(!SUMR_f.isN(p.f.bnc_rule)){ upf.push( mysql.format('ecsnd_bnc_rule=?', p.f.bnc_rule) ); }
                    var upd = upf.join(',');
                }

                if(!SUMR_f.isN(p.id) && !SUMR_f.isN(upd)){

                    if(!SUMR_f.isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

                    let save = await SUMR_db.save({
                        q:`UPDATE `+SUMR_db.str('ec_snd',bd)+` SET ${upd} WHERE id_ecsnd=?`,
                        d:[ p.id ]
                    });

                    if(!SUMR_f.isN(save) && !SUMR_f.isN(save.affectedRows) && save.affectedRows > 0){
                        rsp.e = 'ok';
                    }else {
                        rsp['w'] = 'No ID result';
                    }

                }

                return rsp;

            }

        },

        eml:{

            dt:async function(p=null){

                let fld,
                    rsp={e:'no'};

                if(p.t == 'enc'){ fld = 'cnteml_enc'; }
                else if(p.t == 'eml'){ fld = 'cnteml_eml'; }
                else{ fld = 'id_cnteml'; }

                if(!SUMR_f.isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

                let get = await SUMR_db.get({
                                    q: `SELECT id_cnteml FROM `+SUMR_db.str('cnt_eml',bd)+` WHERE ${fld}=? LIMIT 1`,
                                    d:[ p.id ]
                                });

                if(get){
                    rsp.e = 'ok';
                    if(!SUMR_f.isN(get[0])){
                        rsp.id = get[0].id_cnteml;
                    }
                }else {
                    rsp['w'] = 'No ID result';
                }

                return rsp;

            },

            upd:async function(p=null){

                let rsp={e:'no'};

                if(!SUMR_f.isN(p.f)){
                    let upf=[];
                    if(!SUMR_f.isN(p.f.rjct)){ upf.push( mysql.format('cnteml_rjct=?', p.f.rjct) ); }
                    if(!SUMR_f.isN(p.f.dnc)){ upf.push( mysql.format('cnteml_dnc=?', p.f.dnc) ); }
                    if(!SUMR_f.isN(p.f.cld)){ upf.push( mysql.format('cnteml_cld=?', p.f.cld) ); }
                    var upd = upf.join(',');
                }

                if(!SUMR_f.isN(p.id) && !SUMR_f.isN(upd)){

                    if(!SUMR_f.isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

                    let save = await SUMR_db.save({
                        q:`UPDATE `+SUMR_db.str('cnt_eml',bd)+` SET ${upd} WHERE id_cnteml=?`,
                        d:[ p.id ]
                    });

                    if(!SUMR_f.isN(save) && !SUMR_f.isN(save.affectedRows) && save.affectedRows > 0){
                        rsp.e = 'ok';
                    }else {
                        rsp['w'] = 'No ID result';
                    }

                }

                return rsp;

            }

        }

    },

    us:{

        dt:async function(p=null){

            let fld,
                rsp={e:'no'};

            if(p.t == 'enc'){ fld = 'us_enc'; }
            else if(p.t == 'eml'){ fld = 'us_user'; }
            else{ fld = 'id_us'; }

            let get = await SUMR_db.get({
                                q: `SELECT id_us FROM `+SUMR_db.str('us')+` WHERE ${fld}=? LIMIT 1`,
                                d:[ p.id ]
                            });

            if(get){
                rsp.e = 'ok';
                if(!SUMR_f.isN(get[0])){
                    rsp.id = get[0].id_us;
                }
            }else {
                rsp['w'] = 'No ID result';
            }

            return rsp;

        },

        upd:async function(p=null){

            let rsp={e:'no'};

            if(!SUMR_f.isN(p.f)){
                let upf=[];
                if(!SUMR_f.isN(p.f.dnc)){ upf.push( mysql.format('us_eml_dnc=?', p.f.dnc) ); }
                if(!SUMR_f.isN(p.f.rjct)){ upf.push( mysql.format('us_eml_rjct=?', p.f.rjct) ); }
                if(!SUMR_f.isN(p.f.sndi)){ upf.push( mysql.format('us_eml_sndi=?', p.f.sndi) ); }
                var upd = upf.join(',');
            }

            if(!SUMR_f.isN(p.id) && !SUMR_f.isN(upd)){

                if(!SUMR_f.isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

                let save = await SUMR_db.save({
                    q:`UPDATE `+SUMR_db.str('us',bd)+` SET ${upd} WHERE id_us=?`,
                    d:[ p.id ]
                });

                if(!SUMR_f.isN(save) && !SUMR_f.isN(save.affectedRows) && save.affectedRows > 0){
                    rsp.e = 'ok';
                }else {
                    rsp['w'] = 'No ID result';
                }

            }

            return rsp;

        }

    },

    bnce:{

        getid:async function(p=null){

            let detail = null,
                prnt = null,
                rsp={e:'no'};

            if(p.t == 'sub'){
                detail = await SUMR_sis.slc.dt({ key:'sis_snd_bnc_tp_s' });
            }else{
                detail = await SUMR_sis.slc.dt({ key:'sis_snd_bnc_tp' });
            }

            Object.keys(detail.ls).forEach(function(key){

                var attr = detail.ls[key];

                if(attr.key.vl == p.key){

                    if(!SUMR_f.isN(p.prnt)){
                        prnt = attr[p.prnt].vl;
                    }

                    if(SUMR_f.isN(prnt) || prnt){
                        rsp.e = 'ok';
                        rsp.id = attr.id;
                        rsp.cns = attr.cns;
                        return;
                    }

                }

            });

            return rsp;

        }

    },

    sns:{

        dlvry:async function(event){

            var data={e:'no'};

            const message = JSON.parse(event.Records[0].Sns.Message);
            let header = ses.hdr(message.mail.headers);
            let messageId = message.mail.messageId;

            if(header['SUMR-FLJ'] == 'cl'){

                let snd_dt = await ses.cl.snd.dt({ id:messageId, t:'id' });

                if(!SUMR_f.isN(snd_dt.id)){

                    let upd = await ses.cl.snd.upd({
                        id:snd_dt.id,
                        f:{
                            est:process.env.ID_SNDEST_ACPT
                        }
                    });

                    if(!SUMR_f.isN(upd) && !SUMR_f.isN(upd.e) && upd.e == 'ok'){
                        data['e'] = 'ok';
                    }

                }

            }else if(header['SUMR-FLJ'] == 'ec'){

                let cl_dt = await ses.cl.dt({ t:'enc', id:header['SUMR-CL'] });
                let snd_dt = await ses.cnt.snd.dt({ id:messageId, t:'id', bd:cl_dt.sbd });

                if(!SUMR_f.isN(snd_dt.id) && !SUMR_f.isN(cl_dt.id)){

                    let upd = await ses.cnt.snd.upd({
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

                    if(!SUMR_f.isN(upd) && !SUMR_f.isN(upd.e) && upd.e == 'ok'){
                        data['e'] = 'ok';
                    }else{
						data['w'] = !SUMR_f.isN(upd.w)?upd.w:'';
					}

                }else{

					if(SUMR_f.isN(snd_dt.id)){ data['w'] += 'snd_dt.id empty'; }
					if(SUMR_f.isN(cl_dt.id)){ data['w'] += 'cl_dt.id empty'; }

				}

            }

            return data;

        },

        cmpl:async function(event){

            var data={e:'no'};

            const message = JSON.parse(event.Records[0].Sns.Message);
            let header = ses.hdr(message.mail.headers);
            let messageId = message.mail.messageId;

            if(header['SUMR-FLJ'] == 'cl'){

                let snd_dt = await ses.cl.snd.dt({ id:messageId, t:'id' });

                if(!SUMR_f.isN(snd_dt.id)){

                    Object.keys(message.complaint.complainedRecipients).forEach(async function(key){

                        var eml = message.complaint.complainedRecipients[key].emailAddress;
                        var us_dt = await ses.us.dt({ id:eml, t:'eml' });

                        var upd = await ses.us.upd({
                            id:us_dt.id,
                            f:{
                                dnc: message.complaint.complaintFeedbackType,
                                sndi: 2
                            }
                        });

                        if(!SUMR_f.isN(upd) && !SUMR_f.isN(upd.e) && upd.e == 'ok'){
                            data['e'] = 'ok';
                        }

                    });

                }

            }else if(header['SUMR-FLJ'] == 'ec'){

                let cl_dt = await ses.cl.dt({ t:'enc', id:header['SUMR-CL'] });
                let snd_dt = await ses.cnt.snd.dt({ id:messageId, t:'id', bd:cl_dt.sbd });

                if(!SUMR_f.isN(snd_dt.id) && !SUMR_f.isN(cl_dt.id)){

                    Object.keys(message.complaint.complainedRecipients).forEach(async function(key){

                        var eml = message.complaint.complainedRecipients[key].emailAddress;
                        var eml_dt = await ses.cnt.eml.dt({ id:eml, t:'eml' });

                        var upd = await ses.cnt.eml.upd({
                            id:eml_dt.id,
                            f:{
                                rjct: 1,
                                sndi: 2,
                                dnc: message.complaint.complaintFeedbackType,
                                cld: process.env.ID_CLD_BAD
                            }
                        });

                        if(!SUMR_f.isN(upd) && !SUMR_f.isN(upd.e) && upd.e == 'ok'){
                            data['e'] = 'ok';
                        }

                    });

                }

            }

            return data;

        },
        bnce:async function(event){

            var data={e:'no'};

            const message = JSON.parse(event.Records[0].Sns.Message);
            let header = ses.hdr(message.mail.headers);
            let messageId = message.mail.messageId;
            let tp_id = await ses.bnce.getid({ key:message.bounce.bounceType });
            let tps_id = await ses.bnce.getid({ t:'sub', key:message.bounce.bounceSubType });

            if(header['SUMR-FLJ'] == 'cl'){

                let snd_dt = await ses.cl.snd.dt({ id:messageId, t:'id' });

                if(!SUMR_f.isN(snd_dt.id)){

                    let upd = await ses.cl.snd.upd({
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

                    if(!SUMR_f.isN(upd) && !SUMR_f.isN(upd.e) && upd.e == 'ok'){
                        data['e'] = 'ok';
                    }

                }

            }else if(header['SUMR-FLJ'] == 'ec'){

                let cl_dt = await ses.cl.dt({ t:'enc', id:header['SUMR-CL'] });
                let snd_dt = await ses.cnt.snd.dt({ id:messageId, t:'id', bd:cl_dt.sbd });

                if(!SUMR_f.isN(snd_dt.id) && !SUMR_f.isN(cl_dt.id)){

                    let upd = await ses.cnt.snd.upd({
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

                    if(!SUMR_f.isN(upd) && !SUMR_f.isN(upd.e) && upd.e == 'ok'){
                        data['e'] = 'ok';
                    }

                }

            }

            return data;

        }
    }



};

module.exports = ses;