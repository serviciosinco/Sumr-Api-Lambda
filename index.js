const fs = require('fs');

try {
    if(fs.existsSync('./.env/.env.prd')){
        require('dotenv').config({ path: '.env/.env.prd' });
    }else if(fs.existsSync('./.env/.env.dev')){
        require('dotenv').config({ path: '.env/.env.dev' });
    }else if(fs.existsSync('./.env/.env')) {
        require('dotenv').config({ path: '.env/.env.local' });
    }
} catch(err) {
    console.error(err);
}

const { isN, Path, TimeNow } = require('./functions/common');
const { Service_SES } = require('./functions/services/ses');

exports.handler = async (event, context, callback) => {

    let response = { success:false };

    try {

        if( !isN(event) ){

            let get = event.queryStringParameters;
            let pm1 = Path(event.path, 1);
            let pm2 = Path(event.path, 2);
            let pm3 = Path(event.path, 3);

            if(!isN(pm1) && pm1 == 'v2'){

                if(!isN(pm2) && pm2 == 'time'){
                    response = TimeNow();
                }

            }else if( !isN(event.Records) && !isN(event.Records[0].Sns) ){ // SNS Handler

                response = await Service_SES(event);

            }

            if(!isN(get) && !isN(get.callback)){

                let dataj = JSON.stringify(response);

                return {
                    statusCode: 200,
                    body: `${get.callback}(${dataj})`
                }

            }else{

                return {
                    statusCode: 200,
                    body: JSON.stringify(response)
                }

            }

        }

    }catch(err){

        response.error = err.message;

        return{
            statusCode: 400,
            body: JSON.stringify(response)
        }

    }

};