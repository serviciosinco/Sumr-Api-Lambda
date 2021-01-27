if(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'developer'){
    require('dotenv').config({ path: '/_env/.env.local' });
}

const SUMR_f = require('./_fnc/glbl'),
      SUMR_db = require('./_fnc/db'),
      SUMR_ses = require('./_fnc/ses');

exports.handler = async (event, context, callback) => {

    let data = { e:'no' };

    try {

        if( !SUMR_f.isN(event) ){

            let get = event.queryStringParameters;
            let pm1 = SUMR_f.pml(event.path, 1);
            let pm2 = SUMR_f.pml(event.path, 2);
            let pm3 = SUMR_f.pml(event.path, 3);

            if(!SUMR_f.isN(pm1) && pm1 == 'v2'){

                if(!SUMR_f.isN(pm2) && pm2 == 'time'){
                    data = SUMR_f.tmenow();
                }

            }else if( !SUMR_f.isN(event.Records) && !SUMR_f.isN(event.Records[0].Sns) ){
                data = await SUMR_ses.init(event);
            }

            if(!SUMR_f.isN(get) && !SUMR_f.isN(get.callback)){

                let dataj = JSON.stringify(data);

                return {
                    statusCode: 200,
                    body: `${get.callback}(${dataj})`
                }

            }else{

                return {
                    statusCode: 200,
                    body: JSON.stringify(data)
                }

            }

        }

    }catch(err){

        data['w'] = err.message;

        return{
            statusCode: 400,
            body: JSON.stringify(data)
        }

    }

};