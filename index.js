require('dotenv').config({ path: './.env/.env' });

const { isN, Path, TimeNow } = require('./functions/common');
const { Service_SES } = require('./functions/services/ses');

exports.handler = async (event, context, callback) => {

    let data = { e:'no' };

    try {

        if( !isN(event) ){

            let get = event.queryStringParameters;
            let pm1 = Path(event.path, 1);
            let pm2 = Path(event.path, 2);
            let pm3 = Path(event.path, 3);

            if(!isN(pm1) && pm1 == 'v2'){

                if(!isN(pm2) && pm2 == 'time'){
                    data = TimeNow();
                }

            }else if( !isN(event.Records) && !isN(event.Records[0].Sns) ){ // SNS Handler

                data = await Service_SES(event);

            }

            if(!isN(get) && !isN(get.callback)){

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