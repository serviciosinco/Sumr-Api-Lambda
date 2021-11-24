const { DBGet, DBSave, DBSelector } = require('./connection');
const { isN } = require('./common');
exports.UserDetail = async function(p=null){

    let fld,
        rsp={e:'no'};

    if(p.t == 'enc'){ fld = 'us_enc'; }
    else if(p.t == 'eml'){ fld = 'us_user'; }
    else{ fld = 'id_us'; }

    let get = await DBGet({
                        q: `SELECT id_us FROM `+DBSelector('us')+` WHERE ${fld}=? LIMIT 1`,
                        d:[ p.id ]
                    });

    if(get){
        rsp.e = 'ok';
        if(!isN(get[0])){
            rsp.id = get[0].id_us;
        }
    }else {
        rsp['w'] = 'No ID result';
    }

    return rsp;

};

exports.UserUpdate = async function(p=null){

    let rsp={e:'no'};

    if(!isN(p.f)){
        let upf=[];
        if(!isN(p.f.dnc)){ upf.push( mysql.format('us_eml_dnc=?', p.f.dnc) ); }
        if(!isN(p.f.rjct)){ upf.push( mysql.format('us_eml_rjct=?', p.f.rjct) ); }
        if(!isN(p.f.sndi)){ upf.push( mysql.format('us_eml_sndi=?', p.f.sndi) ); }
        var upd = upf.join(',');
    }

    if(!isN(p.id) && !isN(upd)){

        if(!isN(p.bd)){ var bd=p.bd; }else{ var bd=''; }

        let save = await DBSave({
            q:`UPDATE `+DBSelector('us',bd)+` SET ${upd} WHERE id_us=? LIMIT 1`,
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