const mysql = require('promise-mysql');
const { DBGet, DBSave, DBSelector } = require('./connection');
const { isN } = require('./common');

exports.CustomerSendDetail  = async function(p=null){

    let fld,
        rsp={e:'no'};

    if(p.t == 'enc'){ fld = 'clfljsnd_enc'; }
    else if(p.t == 'id'){ fld = 'clfljsnd_id'; }
    else{ fld = 'id_clfljsnd'; }

    let get = await DBGet({
                        q: `SELECT id_clfljsnd FROM `+DBSelector('_cl_flj_snd')+` INNER JOIN _cl_flj ON clfljsnd_clflj = id_clflj WHERE ${fld}=? LIMIT 1`,
                        d:[ p.id ]
                    });

    if(get){
        rsp.e = 'ok';
        if(!isN(get[0])){
            rsp.id = get[0].id_clfljsnd;
        }
    }else {
        rsp['w'] = 'No ID result';
    }

    return rsp;

};

exports.CustomerSendUpdate = async function(p=null){

    let rsp={e:'no'};

    if(!isN(p.f)){
        let upf=[];
        if(!isN(p.f.est)){ upf.push( mysql.format('clfljsnd_est=?', p.f.est) ); }
        if(!isN(p.f.bnc)){ upf.push( mysql.format('clfljsnd_bnc=?', p.f.bnc) ); }
        if(!isN(p.f.bnc_sbj)){ upf.push( mysql.format('clfljsnd_bnc=?', p.f.bnc_sbj) ); }
        if(!isN(p.f.bnc_msg)){ upf.push( mysql.format('clfljsnd_bnc_msg=?', p.f.bnc_msg) ); }
        if(!isN(p.f.bnc_tp)){ upf.push( mysql.format('clfljsnd_bnc_tp=?', p.f.bnc_tp) ); }
        if(!isN(p.f.bnc_tp_sub)){ upf.push( mysql.format('clfljsnd_bnc_tp_sub=?', p.f.bnc_tp_sub) ); }
        if(!isN(p.f.bnc_rpr)){ upf.push( mysql.format('clfljsnd_bnc_rpr=?', p.f.bnc_rpr) ); }
        if(!isN(p.f.bnc_rule)){ upf.push( mysql.format('clfljsnd_bnc_rule=?', p.f.bnc_rule) ); }
        var upd = upf.join(',');
    }

    if(!isN(p.id) && !isN(upd)){

        let save = await DBSave({
            q:`UPDATE `+DBSelector('_cl_flj_snd')+` SET ${upd} WHERE id_clfljsnd=?`,
            d:[ p.id ]
        });

        if(!isN(save) && !isN(save.affectedRows) && save.affectedRows > 0){
            rsp.e = 'ok';
        }else {
            rsp['w'] = 'No ID result';
        }

    }

    return rsp;

};



exports.LeadSendDetail = async function(p=null){

    let fld,
        rsp={e:'no'};

    if(p.t == 'enc'){ fld = 'ecsnd_enc'; }
    else if(p.t == 'id'){ fld = 'ecsnd_id'; }
    else{ fld = 'id_ecsnd'; }

    if(!isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

    let get = await DBGet({
                        q: `SELECT id_ecsnd FROM `+DBSelector('ec_snd',bd)+` WHERE ${fld}=? LIMIT 1`,
                        d:[ p.id ]
                    });

    if(get){
        rsp.e = 'ok';
        if(!isN(get[0])){
            rsp.id = get[0].id_ecsnd;
        }
    }else {
        rsp['w'] = 'No ID result';
    }

    return rsp;

};


exports.LeadSendUpdate = async function(p=null){

    let rsp={e:'no'};

    if(!isN(p.f)){
        let upf=[];
        if(!isN(p.f.est)){ upf.push( mysql.format('ecsnd_est=?', p.f.est) ); }
        if(!isN(p.f.dlvry_tmmls)){ upf.push( mysql.format('ecsnd_dlvry_tmmls=?', p.f.dlvry_tmmls) ); }
        if(!isN(p.f.dlvry_tmstmp)){ upf.push( mysql.format('ecsnd_dlvry_tmstmp=?', p.f.dlvry_tmstmp) ); }
        if(!isN(p.f.dlvry_smtrsp)){ upf.push( mysql.format('ecsnd_dlvry_smtrsp=?', p.f.dlvry_smtrsp) ); }
        if(!isN(p.f.dlvry_rmtmta)){ upf.push( mysql.format('ecsnd_dlvry_rmtmta=?', p.f.dlvry_rmtmta) ); }
        if(!isN(p.f.dlvry_rmtmta_ip)){ upf.push( mysql.format('ecsnd_dlvry_rmtmta_ip=?', p.f.dlvry_rmtmta_ip) ); }
        if(!isN(p.f.bnc)){ upf.push( mysql.format('ecsnd_bnc=?', p.f.bnc) ); }
        if(!isN(p.f.bnc_sbj)){ upf.push( mysql.format('ecsnd_bnc=?', p.f.bnc_sbj) ); }
        if(!isN(p.f.bnc_msg)){ upf.push( mysql.format('ecsnd_bnc_msg=?', p.f.bnc_msg) ); }
        if(!isN(p.f.bnc_tp)){ upf.push( mysql.format('ecsnd_bnc_tp=?', p.f.bnc_tp) ); }
        if(!isN(p.f.bnc_tp_sub)){ upf.push( mysql.format('ecsnd_bnc_tp_sub=?', p.f.bnc_tp_sub) ); }
        if(!isN(p.f.bnc_rpr)){ upf.push( mysql.format('ecsnd_bnc_rpr=?', p.f.bnc_rpr) ); }
        if(!isN(p.f.bnc_rule)){ upf.push( mysql.format('ecsnd_bnc_rule=?', p.f.bnc_rule) ); }
        var upd = upf.join(',');
    }

    if(!isN(p.id) && !isN(upd)){

        if(!isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

        let save = await DBSave({
            q:`UPDATE `+DBSelector('ec_snd',bd)+` SET ${upd} WHERE id_ecsnd=?`,
            d:[ p.id ]
        });

        if(!isN(save) && !isN(save.affectedRows) && save.affectedRows > 0){
            rsp.e = 'ok';
        }else {
            rsp['w'] = 'No ID result';
        }

    }

    return rsp;

};



exports.LeadSendOpened = async function(p=null){

    let rsp={e:'no'};

    if(!isN(p.id) && !isN(upd)){

        if(!isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

        let save = await DBSave({
            q:`INSERT INTO `+DBSelector('ec_op',bd)+`(ecop_snd, ecop_f, ecop_h, ecop_m, ecop_brw_t, ecop_brw_v, ecop_brw_p) VALUES (?,?,?,?,?,?,?)`,
            d:[ 
                p.f.snd,
                p.f.date,
                p.f.hour,
                p.f.medium,
                p.f.browse.name,
                p.f.browse.version,
                p.f.browse.platform
            ]
        });

        if(!isN(save) && !isN(save.affectedRows) && save.affectedRows > 0){
            rsp.e = 'ok';
        }else {
            rsp['w'] = 'No ID result';
        }

    }

    return rsp;

};