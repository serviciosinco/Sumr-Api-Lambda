const { DBGet, DBSave, DBSelector } = require('./connection');
const { isN } = require('./common');
exports.LeadEmailDetail = async function(p=null){

    let fld,
        rsp={e:'no'};

    if(p.t == 'enc'){ fld = 'cnteml_enc'; }
    else if(p.t == 'eml'){ fld = 'cnteml_eml'; }
    else{ fld = 'id_cnteml'; }

    if(!isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

    let get = await DBGet({
                        q: `SELECT id_cnteml FROM `+DBSelector('cnt_eml',bd)+` WHERE ${fld}=? LIMIT 1`,
                        d:[ p.id ]
                    });

    if(get){
        rsp.e = 'ok';
        if(!isN(get[0])){
            rsp.id = get[0].id_cnteml;
        }
    }else {
        rsp['w'] = 'No ID result';
    }

    return rsp;

};

exports.LeadEmailUpdate = async function(p=null){

    let rsp={e:'no'};

    if(!isN(p.f)){
        let upf=[];
        if(!isN(p.f.rjct)){ upf.push( mysql.format('cnteml_rjct=?', p.f.rjct) ); }
        if(!isN(p.f.dnc)){ upf.push( mysql.format('cnteml_dnc=?', p.f.dnc) ); }
        if(!isN(p.f.cld)){ upf.push( mysql.format('cnteml_cld=?', p.f.cld) ); }
        var upd = upf.join(',');
    }

    if(!isN(p.id) && !isN(upd)){

        if(!isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

        let save = await DBSave({
            q:`UPDATE `+DBSelector('cnt_eml',bd)+` SET ${upd} WHERE id_cnteml=? LIMIT 1`,
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